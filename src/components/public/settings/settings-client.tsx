'use client'

import { useEffect, useState } from 'react'
import { useTranslations } from 'next-intl'
import { cn } from '@/lib/utils'
import {
  ARABIC_FONTS, BENGALI_FONTS, ARABIC_FONT_KEY, BENGALI_FONT_KEY,
  getArabicFontKey, getBengaliFontKey,
} from '@/lib/quran-fonts'
import {
  getSettings, saveSettings, DEFAULT_SETTINGS,
  HIJRI_ADJUSTMENTS, MADHABS, CALCULATION_METHODS, PRAYER_OFFSETS,
  type AppSettings, type MadhabSetting, type PrayerOffsetKey,
} from '@/lib/settings'
import { bn } from '@/lib/bengali-numerals'

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="rounded-2xl border border-border bg-card p-5 sm:p-6">
      <h2 className="text-sm font-bold uppercase tracking-wider text-primary mb-5">{title}</h2>
      <div className="space-y-5">{children}</div>
    </section>
  )
}

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2.5">
      <p className="text-sm font-medium text-foreground">{label}</p>
      <div className="sm:w-[280px] shrink-0">{children}</div>
    </div>
  )
}

function Select({ value, onChange, options }: {
  value: string
  onChange: (v: string) => void
  options: { value: string; label: string }[]
}) {
  return (
    <select
      value={value}
      onChange={e => onChange(e.target.value)}
      className="w-full px-3 py-2 rounded-xl border border-border bg-muted text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
    >
      {options.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
    </select>
  )
}

export function SettingsClient() {
  const t = useTranslations('SettingsPage')
  const [settings, setSettings] = useState<AppSettings>(DEFAULT_SETTINGS)
  const [arabicFont, setArabicFont] = useState(ARABIC_FONTS[0].key)
  const [banglaFont, setBanglaFont] = useState(BENGALI_FONTS[0].key)
  const [ready, setReady] = useState(false)

  useEffect(() => {
    setSettings(getSettings())
    setArabicFont(getArabicFontKey())
    setBanglaFont(getBengaliFontKey())
    setReady(true)
  }, [])

  // Persist on every change — the old site saved immediately too (no explicit save button).
  function update(patch: Partial<AppSettings>) {
    setSettings(saveSettings(patch))
  }

  // Fonts live under the Quran readers' own keys so the pickers here and the
  // in-reader pickers drive the same preference.
  function updateArabicFont(key: string) {
    setArabicFont(key)
    try { localStorage.setItem(ARABIC_FONT_KEY, key) } catch { /* ignore */ }
  }

  function updateBanglaFont(key: string) {
    setBanglaFont(key)
    try { localStorage.setItem(BENGALI_FONT_KEY, key) } catch { /* ignore */ }
  }

  function reset() {
    setSettings(saveSettings(DEFAULT_SETTINGS))
    updateArabicFont(ARABIC_FONTS[0].key)
    updateBanglaFont(BENGALI_FONTS[0].key)
  }

  if (!ready) return null

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 py-10">
      <div className="flex items-center justify-between gap-3 mb-8">
        <h1 className="text-3xl font-bold text-foreground">{t('title')}</h1>
        <button
          onClick={reset}
          className="text-xs text-muted-foreground hover:text-primary transition-colors whitespace-nowrap"
        >
          {t('resetToDefault')}
        </button>
      </div>

      <div className="space-y-5">
        {/* ── General ── */}
        <Section title={t('generalSection')}>
          <Row label={t('hijriAdjustmentLabel')}>
            <div className="flex gap-1.5">
              {HIJRI_ADJUSTMENTS.map(v => (
                <button
                  key={v}
                  onClick={() => update({ hijriAdjustment: v })}
                  className={cn(
                    'flex-1 py-2 rounded-lg border text-sm font-medium transition-all tabular-nums',
                    settings.hijriAdjustment === v
                      ? 'border-primary bg-primary text-primary-foreground'
                      : 'border-border bg-muted text-muted-foreground hover:border-primary/50 hover:text-primary'
                  )}
                >
                  {v > 0 ? `+${bn(v)}` : bn(v)}
                </button>
              ))}
            </div>
          </Row>

          <Row label={t('arabicFontLabel')}>
            <Select
              value={arabicFont}
              onChange={updateArabicFont}
              options={ARABIC_FONTS.map(f => ({ value: f.key, label: f.label }))}
            />
          </Row>

          <Row label={t('banglaFontLabel')}>
            <Select
              value={banglaFont}
              onChange={updateBanglaFont}
              options={BENGALI_FONTS.map(f => ({ value: f.key, label: f.label }))}
            />
          </Row>
        </Section>

        {/* ── Prayer time calculation ── */}
        <Section title={t('prayerCalcSection')}>
          <Row label={t('madhabLabel')}>
            <Select
              value={settings.madhab}
              onChange={v => update({ madhab: v as MadhabSetting })}
              options={MADHABS}
            />
          </Row>

          <Row label={t('methodLabel')}>
            <Select
              value={settings.method}
              onChange={v => update({ method: v })}
              options={CALCULATION_METHODS}
            />
          </Row>
        </Section>

        {/* ── Per-prayer minute offsets ── */}
        <Section title={t('offsetSection')}>
          {PRAYER_OFFSETS.map(({ key, label }) => (
            <Row key={key} label={label}>
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  min={-60}
                  max={60}
                  value={settings[key as PrayerOffsetKey]}
                  onChange={e => {
                    const n = parseInt(e.target.value, 10)
                    update({ [key]: Number.isNaN(n) ? 0 : n } as Partial<AppSettings>)
                  }}
                  className="w-full px-3 py-2 rounded-xl border border-border bg-muted text-sm text-foreground tabular-nums focus:outline-none focus:ring-2 focus:ring-ring"
                />
                <span className="text-xs text-muted-foreground shrink-0">{t('minuteUnit')}</span>
              </div>
            </Row>
          ))}
        </Section>
      </div>

      <p className="text-xs text-muted-foreground text-center mt-6">
        {t('footerNote')}
      </p>
    </div>
  )
}
