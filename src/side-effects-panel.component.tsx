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

const SideEffectsPanel: React.FC<SideEffectsPanelProps> = ({ drugUuid }) => {
  const { t } = useTranslation();
  const { displaySideEffects } = useConfig<ConfigObject>();
  const { sideEffects, error, isLoading } = useMedicationSideEffects(drugUuid);

  if (!displaySideEffects || !drugUuid) {
    return null;
  }

  if (isLoading) {
    return <SkeletonText paragraph lineCount={2} className={styles.skeleton} />;
  }

  if (error) {
    return (
      <InlineNotification
        kind="warning"
        lowContrast
        hideCloseButton
        title={t('sideEffectsLoadError', 'Unable to load side effects')}
      />
    );
  }

  if (!sideEffects.length) {
    return null;
  }

  const common = sideEffects.filter((sideEffect) => !sideEffect.serious);
  const serious = sideEffects.filter((sideEffect) => sideEffect.serious);

  const renderGroup = (label: string, items: Array<SideEffect>, tagType: 'teal' | 'magenta') =>
    items.length > 0 && (
      <div className={styles.group}>
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
      {renderGroup(t('commonSideEffects', 'Common'), common, 'teal')}
      {renderGroup(t('seriousSideEffects', 'Serious'), serious, 'magenta')}
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
