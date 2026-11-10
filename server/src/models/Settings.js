import mongoose from 'mongoose';

const settingsSchema = new mongoose.Schema(
    {
        key: {
            type: String,
            unique: true,
            default: 'global'
        },
        subscription: {
            planName: {
                type: String,
                default: 'Suscripción mensual'
            },
            monthlyPriceBTT: {
                type: Number,
                min: 0,
                default: () => Number(process.env.MONTHLY_SUBSCRIPTION_BTT) || 1000
            },
            durationDays: {
                type: Number,
                min: 1,
                default: 30
            },
            currency: {
                type: String,
                default: 'BTT'
            }
        },
        updatedBy: {
            type: String,
            lowercase: true
        }
    },
    {
        timestamps: true
    }
);

const Settings = mongoose.model('Settings', settingsSchema);

export default Settings;
