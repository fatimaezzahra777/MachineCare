const mongoose = require('mongoose');

const machineSchema = new mongoose.Schema(
  {
    reference: {
      type: String,
      required: [true, 'La référence est obligatoire'],
      unique: true,
      trim: true,
    },
    nom: { type: String, required: [true, 'Le nom est obligatoire'], trim: true },
    atelier: { type: String, required: [true, "L'atelier est obligatoire"], trim: true },
    etat: {
      type: String,
      enum: {
        values: ['disponible', 'en_maintenance', 'hors_service'],
        message: 'État inconnu : {VALUE}',
      },
      default: 'disponible',
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Machine', machineSchema);
