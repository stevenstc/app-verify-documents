import Settings from '../models/Settings.js';

export const getPricingSettings = async () => {
    const settings = await Settings.findOneAndUpdate(
        { key: 'global' },
        {
            $setOnInsert: {
                key: 'global',
                subscription: {
                    planName: 'Suscripción mensual',
                    monthlyPriceBTT: Number(process.env.MONTHLY_SUBSCRIPTION_BTT) || 1000,
                    durationDays: 30,
                    currency: 'BTT'
                }
            }
        },
        { new: true, upsert: true }
    );

    return {
        planName: settings.subscription.planName,
        monthlyPriceBTT: settings.subscription.monthlyPriceBTT,
        durationDays: settings.subscription.durationDays,
        currency: settings.subscription.currency,
        updatedAt: settings.updatedAt || settings.createdAt
    };
};

export const savePricingSettings = async ({ planName, monthlyPriceBTT, durationDays, updatedBy }) => {
    const current = await getPricingSettings();

    const next = {
        planName: planName?.trim() || current.planName,
        monthlyPriceBTT: Number(monthlyPriceBTT),
        durationDays: Number(durationDays),
        currency: 'BTT'
    };

    const settings = await Settings.findOneAndUpdate(
        { key: 'global' },
        {
            $set: {
                subscription: next,
                updatedBy
            }
        },
        { new: true, upsert: true }
    );

    return {
        planName: settings.subscription.planName,
        monthlyPriceBTT: settings.subscription.monthlyPriceBTT,
        durationDays: settings.subscription.durationDays,
        currency: settings.subscription.currency,
        updatedAt: settings.updatedAt
    };
};
