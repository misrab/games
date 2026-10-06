import { t } from '../../core/i18n';
import { meterPair } from './html';

export function introBlock(biasId: string, playKey: string, bodyKey: string, controlsDesktop: string, controlsTouch: string): string {
  return `
    <h2 class="bk__q">${t(`bias.${biasId}.name`)}</h2>
    <p class="bk__note">${t(`bias.${biasId}.body`)}</p>
    <a class="bk__paper" href="${t(`bias.${biasId}.url`)}" target="_blank" rel="noopener noreferrer">${t(`bias.${biasId}.link`)}</a>
    <p class="bk__note">${t(bodyKey)}</p>
    <p class="bk__note">${t('sub.controlsHint', { desktop: controlsDesktop, touch: controlsTouch })}</p>
    <button type="button" class="bk__btn" data-act="start" data-focus>${t(playKey)}</button>`;
}

export function doneBlock(before: number, after: number, extra = ''): string {
  return `
    <h2 class="bk__q">${t('sub.meter.title')}</h2>
    ${meterPair(before, after, t('sub.meter.before'), t('sub.meter.after'))}
    <p class="bk__note">${t('sub.meter.note')}</p>
    ${extra}
    <button type="button" class="bk__btn" data-act="again" data-focus>${t('sub.again')}</button>`;
}

export function tipBlock(titleKey: string, bodyKey: string): string {
  return `
    <h2 class="bk__q">${t(titleKey)}</h2>
    <p class="bk__note">${t(bodyKey)}</p>
    <button type="button" class="bk__btn" data-act="tip" data-focus>${t('sub.continue')}</button>`;
}
