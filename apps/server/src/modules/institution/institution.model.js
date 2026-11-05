const mongoose = require('mongoose');

const institutionSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'College name is required'],
      trim: true,
      default: 'Apex Institute of Technology & Engineering'
    },
    code: {
      type: String,
      required: [true, 'Institution code is required'],
      trim: true,
      uppercase: true,
      default: 'AITE-500032'
    },
    establishedYear: {
      type: Number,
      default: 2008,
      min: [1800, 'Established year must be after 1800'],
      max: [new Date().getFullYear() + 1, 'Established year cannot be in the future']
    },
    tagline: {
      type: String,
      trim: true,
      default: 'Excellence in Engineering & Technological Innovation'
    },
    institutionType: {
      type: String,
      trim: true,
      default: 'Autonomous Engineering College'
    },
    logoUrl: {
      type: String,
      trim: true,
      default: ''
    },
    address: {
      line1: {
        type: String,
        trim: true,
        default: 'Survey No. 45/2, Knowledge City Road'
      },
      line2: {
        type: String,
        trim: true,
        default: 'Financial District, Gachibowli'
      },
      city: {
        type: String,
        trim: true,
        default: 'Hyderabad'
      },
      state: {
        type: String,
        trim: true,
        default: 'Telangana'
      },
      postalCode: {
        type: String,
        trim: true,
        default: '500032'
      },
      country: {
        type: String,
        trim: true,
        default: 'India'
      }
    },
    contact: {
      email: {
        type: String,
        trim: true,
        lowercase: true,
        default: 'registrar@apexengineering.edu'
      },
      phone: {
        type: String,
        trim: true,
        default: '+91 40 2345 6789'
      },
      emergencyPhone: {
        type: String,
        trim: true,
        default: '+91 98480 99887'
      },
      website: {
        type: String,
        trim: true,
        default: 'https://www.apexengineering.edu'
      }
    },
    affiliation: {
      university: {
        type: String,
        trim: true,
        default: 'Jawaharlal Nehru Technological University (JNTU)'
      },
      approvalBody: {
        type: String,
        trim: true,
        default: 'All India Council for Technical Education (AICTE)'
      },
      aicteApprovalNumber: {
        type: String,
        trim: true,
        default: 'AICTE-F-1-432891901/2024'
      },
      ugcStatus: {
        type: String,
        trim: true,
        default: '2(f) & 12(B) Recognized'
      },
      autonomousStatus: {
        type: String,
        trim: true,
        default: 'UGC Autonomous Status Conferred (2020-2030)'
      }
    },
    accreditation: {
      naacGrade: {
        type: String,
        trim: true,
        enum: ['A++', 'A+', 'A', 'B++', 'B+', 'B', 'C', 'Not Accredited'],
        default: 'A++'
      },
      naacCgpa: {
        type: String,
        trim: true,
        default: '3.68 / 4.00'
      },
      naacValidUntil: {
        type: String,
        trim: true,
        default: '2028-12-31'
      },
      nbaStatus: {
        type: String,
        trim: true,
        default: 'Tier-1 Accredited (CSE, ECE, MECH, EEE)'
      },
      nirfRankBand: {
        type: String,
        trim: true,
        default: 'Rank Band 101 - 150 (Engineering)'
      }
    },
    targetStudentCapacity: {
      type: Number,
      default: 1000
    },
    currentAcademicYear: {
      type: String,
      trim: true,
      default: '2026 - 2027'
    },
    activeSemesterTerm: {
      type: String,
      trim: true,
      default: 'Odd Semester (Sem 1, 3, 5, 7)'
    },
    updatedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    }
  },
  {
    timestamps: true
  }
);

/**
 * Singleton retrieval helper:
 * Finds the single institution document or creates the initial baseline.
 */
institutionSchema.statics.getSingleton = async function () {
  let doc = await this.findOne();
  if (!doc) {
    doc = await this.create({});
  }
  return doc;
};

const Institution = mongoose.model('Institution', institutionSchema);

module.exports = Institution;

