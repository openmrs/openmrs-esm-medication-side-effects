import React from 'react';
import { useTranslation } from 'react-i18next';
import { InlineNotification, SkeletonText, Tag, Tooltip } from '@carbon/react';
import { WarningFilled } from '@carbon/react/icons';
import { useConfig } from '@openmrs/esm-framework';
import { type ConfigObject } from './config-schema';
import { type SideEffect, useMedicationSideEffects } from './side-effects.resource';
import styles from './side-effects-panel.scss';

interface SideEffectsPanelProps {
  drugUuid?: string;
}

type TagType = 'teal' | 'magenta' | 'gray';

const SideEffectsPanel: React.FC<SideEffectsPanelProps> = ({ drugUuid }) => {
  const { t } = useTranslation();
  const { displaySideEffects } = useConfig<ConfigObject>();
  const { sideEffects, error, isLoading } = useMedicationSideEffects(displaySideEffects ? drugUuid : undefined);

  if (!displaySideEffects || !drugUuid) {
    return null;
  }

  if (isLoading) {
    return <SkeletonText paragraph lineCount={2} className={styles.skeleton} />;
  }

  if (error) {
    console.error('Unable to load medication side effects', error);
    return null;
  }

  if (!sideEffects.length) {
    return null;
  }

  const groupMeta = (classification: string | undefined): { label: string; tagType: TagType } => {
    switch (classification) {
      case 'COMMON':
        return { label: t('commonSideEffects', 'Common'), tagType: 'teal' };
      case 'SERIOUS':
        return { label: t('seriousSideEffects', 'Serious'), tagType: 'magenta' };
      default:
        return { label: classification || t('otherSideEffects', 'Other'), tagType: 'gray' };
    }
  };

  const rank = (classification: string | undefined) =>
    classification === 'COMMON' ? 0 : classification === 'SERIOUS' ? 1 : 2;

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
  const groups = Array.from(grouped.keys()).sort((a, b) => rank(a) - rank(b));

  const renderGroup = (key: string, label: string, items: Array<SideEffect>, tagType: TagType) =>
    items.length > 0 && (
      <div key={key} className={styles.group}>
        <span className={styles.groupLabel}>{label}</span>
        <div className={styles.badges}>
          {items.map((sideEffect) => (
            <span key={sideEffect.id} className={styles.badge}>
              <Tag type={tagType} className={styles.tag}>
                {sideEffect.name}
              </Tag>
              {sideEffect.action && (
                <Tooltip align="bottom" label={sideEffect.action}>
                  <button
                    type="button"
                    className={styles.actionTrigger}
                    aria-label={t('recommendedAction', 'Recommended action')}>
                    <WarningFilled size={16} className={styles.actionIcon} />
                  </button>
                </Tooltip>
              )}
            </span>
          ))}
        </div>
      </div>
    );

  return (
    <div className={styles.container}>
      <span className={styles.title}>{t('knownSideEffects', 'Known side effects')}</span>
      {groups.map((classification) => {
        const { label, tagType } = groupMeta(classification);
        return renderGroup(classification ?? 'unknown', label, grouped.get(classification) ?? [], tagType);
      })}
      <InlineNotification
        kind="info"
        lowContrast
        hideCloseButton
        className={styles.counsel}
        title={t('counselPatientOnSideEffects', 'Counsel the patient on the above side effects')}
      />
    </div>
  );
};

export default SideEffectsPanel;
