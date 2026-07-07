import { getSettings, Settings } from '../models/Settings.js';

export async function getSettingsHandler(req, res) {
  const settings = await getSettings();
  res.json({ item: settings });
}

export async function updateSettings(req, res) {
  const { caution20Rate, caution40Rate, cautionCurrency } = req.body;
  const payload = {};
  if (caution20Rate !== undefined) payload.caution20Rate = caution20Rate;
  if (caution40Rate !== undefined) payload.caution40Rate = caution40Rate;
  if (cautionCurrency !== undefined) payload.cautionCurrency = cautionCurrency;

  let settings = await Settings.findOne();
  if (!settings) {
    settings = await Settings.create(payload);
  } else {
    Object.assign(settings, payload);
    await settings.save();
  }
  res.json({ item: settings });
}
