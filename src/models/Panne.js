const mongoose = require('mongoose');

const panneSchema = new mongoose.Schema(
  {
    machine: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Machine',
      required: [true, 'La machine est obligatoire'],
    },
    description: {
      type: String,
      required: [true, 'La description est obligatoire'],
      trim: true,
    },
    statut: {
      type: String,
      enum: {
        values: ['ouvert', 'en_cours', 'resolu'],
        message: 'Statut inconnu : {VALUE}',
      },
      default: 'ouvert',
    },
    declaredBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    noteResolution: { type: String, trim: true },
    dateResolution: { type: Date },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Panne', panneSchema);
