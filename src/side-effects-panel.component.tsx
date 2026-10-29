import React, { useEffect, useId, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ChevronDown, ChevronUp, InformationFilled, WarningFilled } from '@carbon/react/icons';
import { useConfig } from '@openmrs/esm-framework';
import { type ConfigObject } from './config-schema';
import { type SideEffect, useMedicationSideEffects } from './side-effects.resource';
import styles from './side-effects-panel.scss';

interface SideEffectsPanelProps {
  drugUuid?: string;
}

const SideEffectsPanel: React.FC<SideEffectsPanelProps> = ({ drugUuid }) => {
  const { t } = useTranslation();
  const { displaySideEffects } = useConfig<ConfigObject>();
  const { sideEffects, error } = useMedicationSideEffects(displaySideEffects ? drugUuid : undefined);
  const [expanded, setExpanded] = useState(false);
  const detailsId = useId();

  useEffect(() => {
    if (error) {
      console.error('Unable to load medication side effects', error);
    }
  }, [error]);

  if (!displaySideEffects || !drugUuid) {
    return null;
  }

  if (error) {
    return null;
  }

  if (!sideEffects.length) {
    return null;
  }

  const groupLabel = (classification: string | undefined) => {
    switch (classification) {
      case 'COMMON':
        return t('commonSideEffects', 'Common');
      case 'SERIOUS':
        return t('seriousSideEffects', 'Serious');
      default:
        return classification || t('otherSideEffects', 'Other');
    }
  };

  const rank = (classification: string | undefined) =>
    classification === 'SERIOUS' ? 0 : classification === 'COMMON' ? 1 : 2;

  const grouped = new Map<string | undefined, Array<SideEffect>>();
  for (const sideEffect of sideEffects) {
    const key = sideEffect.classification || undefined;
    const bucket = grouped.get(key);
    if (bucket) {
      bucket.push(sideEffect);
    } else {
      grouped.set(key, [sideEffect]);
    }
  }
  const groups = Array.from(grouped.keys())
    .sort((a, b) => rank(a) - rank(b))
    .map((classification) => ({
      key: classification ?? 'unknown',
      label: groupLabel(classification),
      serious: classification === 'SERIOUS',
      items: grouped.get(classification) ?? [],
    }));

  const seriousClass = (className: string, serious: boolean) =>
    serious ? `${className} ${styles.serious}` : className;

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <span className={styles.title}>{t('sideEffects', 'Side effects').toUpperCase()}</span>
        {groups.map(({ key, label, serious, items }) => (
          <span key={key} className={seriousClass(styles.count, serious)}>
            {serious && <WarningFilled size={16} className={styles.seriousIcon} />}
            {`${items.length} ${label.toLowerCase()}`}
          </span>
        ))}
        <button
          type="button"
          className={styles.toggle}
          aria-expanded={expanded}
          aria-controls={detailsId}
          onClick={() => setExpanded((value) => !value)}>
          {expanded ? t('hideDetails', 'Hide details') : t('showDetails', 'Show details')}
          {expanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
        </button>
      </div>
      {expanded && (
        <div
          id={detailsId}
          role="region"
          aria-label={t('sideEffectDetails', 'Side effect details')}
          className={styles.details}>
          {groups.map(({ key, label, serious, items }) => (
            <section key={key} className={styles.group}>
              <h4 className={seriousClass(styles.groupLabel, serious)}>
                {serious && <WarningFilled size={16} className={styles.seriousIcon} />}
                {label}
              </h4>
              <ul className={styles.list}>
                {items.map((sideEffect) => (
                  <li key={sideEffect.id}>
                    {sideEffect.name}
                    {sideEffect.action && (
                      <span className={styles.action}>
                        <span className={styles.visuallyHidden}>{t('recommendedAction', 'Recommended action')}: </span>
                        {sideEffect.action}
                      </span>
                    )}
                  </li>
                ))}
              </ul>
            </section>
          ))}
          <p className={styles.counsel}>
            <InformationFilled size={16} className={styles.counselIcon} />
            {t('counselPatientOnSideEffects', 'Counsel the patient on these side effects.')}
          </p>
        </div>
      )}
    </div>
  );
};

export default SideEffectsPanel;
