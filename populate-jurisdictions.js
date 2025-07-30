const fs = require('fs');
const path = require('path');

// Import the local bar jurisdictions data
const barJurisdictionsData = [
  // UBE JURISDICTIONS (41 total as of 2024)
  
  // A-D
  {
    id: 1,
    name: "Alabama",
    abbreviation: "AL",
    isUBE: true,
    passingScore: 260,
    examDates: ["February", "July"],
    admissionOnMotion: true,
    notes: "Lowest UBE passing score"
  },
  {
    id: 2,
    name: "Alaska",
    abbreviation: "AK",
    isUBE: true,
    passingScore: 280,
    examDates: ["February", "July"],
    admissionOnMotion: true,
    notes: "Highest UBE passing score"
  },
  {
    id: 3,
    name: "Arizona",
    abbreviation: "AZ",
    isUBE: true,
    passingScore: 270,
    examDates: ["February", "July"],
    admissionOnMotion: true
  },
  {
    id: 4,
    name: "Arkansas",
    abbreviation: "AR",
    isUBE: true,
    passingScore: 270,
    examDates: ["February", "July"],
    admissionOnMotion: false
  },
  {
    id: 5,
    name: "Colorado",
    abbreviation: "CO",
    isUBE: true,
    passingScore: 270,
    examDates: ["February", "July"],
    admissionOnMotion: true
  },
  {
    id: 6,
    name: "Connecticut",
    abbreviation: "CT",
    isUBE: true,
    passingScore: 270,
    examDates: ["February", "July"],
    admissionOnMotion: true
  },
  {
    id: 7,
    name: "District of Columbia",
    abbreviation: "DC",
    isUBE: true,
    passingScore: 266,
    examDates: ["February", "July"],
    admissionOnMotion: true
  },

  // I-M
  {
    id: 8,
    name: "Idaho",
    abbreviation: "ID",
    isUBE: true,
    passingScore: 270,
    examDates: ["February", "July"],
    admissionOnMotion: true
  },
  {
    id: 9,
    name: "Illinois",
    abbreviation: "IL",
    isUBE: true,
    passingScore: 266,
    examDates: ["February", "July"],
    admissionOnMotion: true
  },
  {
    id: 10,
    name: "Indiana",
    abbreviation: "IN",
    isUBE: true,
    passingScore: 270,
    examDates: ["February", "July"],
    admissionOnMotion: true
  },
  {
    id: 11,
    name: "Iowa",
    abbreviation: "IA",
    isUBE: true,
    passingScore: 266,
    examDates: ["February", "July"],
    admissionOnMotion: true
  },
  {
    id: 12,
    name: "Kansas",
    abbreviation: "KS",
    isUBE: true,
    passingScore: 266,
    examDates: ["February", "July"],
    admissionOnMotion: true
  },
  {
    id: 13,
    name: "Kentucky",
    abbreviation: "KY",
    isUBE: true,
    passingScore: 270,
    examDates: ["February", "July"],
    admissionOnMotion: true
  },
  {
    id: 14,
    name: "Maine",
    abbreviation: "ME",
    isUBE: true,
    passingScore: 270,
    examDates: ["February", "July"],
    admissionOnMotion: true
  },
  {
    id: 15,
    name: "Maryland",
    abbreviation: "MD",
    isUBE: true,
    passingScore: 266,
    examDates: ["February", "July"],
    admissionOnMotion: true
  },
  {
    id: 16,
    name: "Massachusetts",
    abbreviation: "MA",
    isUBE: true,
    passingScore: 270,
    examDates: ["February", "July"],
    admissionOnMotion: true
  },
  {
    id: 17,
    name: "Minnesota",
    abbreviation: "MN",
    isUBE: true,
    passingScore: 260,
    examDates: ["February", "July"],
    admissionOnMotion: true,
    notes: "Lowest UBE passing score"
  },
  {
    id: 18,
    name: "Missouri",
    abbreviation: "MO",
    isUBE: true,
    passingScore: 260,
    examDates: ["February", "July"],
    admissionOnMotion: true,
    notes: "Lowest UBE passing score"
  },
  {
    id: 19,
    name: "Montana",
    abbreviation: "MT",
    isUBE: true,
    passingScore: 270,
    examDates: ["February", "July"],
    admissionOnMotion: true
  },

  // N-O
  {
    id: 20,
    name: "Nebraska",
    abbreviation: "NE",
    isUBE: true,
    passingScore: 270,
    examDates: ["February", "July"],
    admissionOnMotion: true
  },
  {
    id: 21,
    name: "New Hampshire",
    abbreviation: "NH",
    isUBE: true,
    passingScore: 270,
    examDates: ["February", "July"],
    admissionOnMotion: true
  },
  {
    id: 22,
    name: "New Jersey",
    abbreviation: "NJ",
    isUBE: true,
    passingScore: 266,
    examDates: ["February", "July"],
    admissionOnMotion: true
  },
  {
    id: 23,
    name: "New Mexico",
    abbreviation: "NM",
    isUBE: true,
    passingScore: 260,
    examDates: ["February", "July"],
    admissionOnMotion: true,
    notes: "Lowest UBE passing score"
  },
  {
    id: 24,
    name: "New York",
    abbreviation: "NY",
    isUBE: true,
    passingScore: 266,
    examDates: ["February", "July"],
    admissionOnMotion: true
  },
  {
    id: 25,
    name: "North Carolina",
    abbreviation: "NC",
    isUBE: true,
    passingScore: 270,
    examDates: ["February", "July"],
    admissionOnMotion: true
  },
  {
    id: 26,
    name: "North Dakota",
    abbreviation: "ND",
    isUBE: true,
    passingScore: 260,
    examDates: ["February", "July"],
    admissionOnMotion: true,
    notes: "Lowest UBE passing score"
  },
  {
    id: 27,
    name: "Ohio",
    abbreviation: "OH",
    isUBE: true,
    passingScore: 270,
    examDates: ["February", "July"],
    admissionOnMotion: true
  },
  {
    id: 28,
    name: "Oklahoma",
    abbreviation: "OK",
    isUBE: true,
    passingScore: 270,
    examDates: ["February", "July"],
    admissionOnMotion: true
  },
  {
    id: 29,
    name: "Oregon",
    abbreviation: "OR",
    isUBE: true,
    passingScore: 270,
    examDates: ["February", "July"],
    admissionOnMotion: true
  },

  // P-V
  {
    id: 30,
    name: "Pennsylvania",
    abbreviation: "PA",
    isUBE: true,
    passingScore: 272,
    examDates: ["February", "July"],
    admissionOnMotion: true
  },
  {
    id: 31,
    name: "Rhode Island",
    abbreviation: "RI",
    isUBE: true,
    passingScore: 270,
    examDates: ["February", "July"],
    admissionOnMotion: true
  },
  {
    id: 32,
    name: "South Carolina",
    abbreviation: "SC",
    isUBE: true,
    passingScore: 270,
    examDates: ["February", "July"],
    admissionOnMotion: true
  },
  {
    id: 33,
    name: "Tennessee",
    abbreviation: "TN",
    isUBE: true,
    passingScore: 270,
    examDates: ["February", "July"],
    admissionOnMotion: true
  },
  {
    id: 34,
    name: "Texas",
    abbreviation: "TX",
    isUBE: true,
    passingScore: 270,
    examDates: ["February", "July"],
    admissionOnMotion: true
  },
  {
    id: 35,
    name: "Utah",
    abbreviation: "UT",
    isUBE: true,
    passingScore: 270,
    examDates: ["February", "July"],
    admissionOnMotion: true
  },
  {
    id: 36,
    name: "Vermont",
    abbreviation: "VT",
    isUBE: true,
    passingScore: 270,
    examDates: ["February", "July"],
    admissionOnMotion: true
  },

  // W-WY
  {
    id: 37,
    name: "Washington",
    abbreviation: "WA",
    isUBE: true,
    passingScore: 270,
    examDates: ["February", "July"],
    admissionOnMotion: true
  },
  {
    id: 38,
    name: "West Virginia",
    abbreviation: "WV",
    isUBE: true,
    passingScore: 270,
    examDates: ["February", "July"],
    admissionOnMotion: true
  },
  {
    id: 39,
    name: "Wyoming",
    abbreviation: "WY",
    isUBE: true,
    passingScore: 270,
    examDates: ["February", "July"],
    admissionOnMotion: true
  },

  // TERRITORIES - UBE
  {
    id: 40,
    name: "U.S. Virgin Islands",
    abbreviation: "VI",
    isUBE: true,
    passingScore: 270,
    examDates: ["February", "July"],
    admissionOnMotion: false
  },
  {
    id: 41,
    name: "American Samoa",
    abbreviation: "AS",
    isUBE: true,
    passingScore: 270,
    examDates: ["February", "July"],
    admissionOnMotion: false
  },

  // NON-UBE JURISDICTIONS (15 total)
  
  {
    id: 42,
    name: "California",
    abbreviation: "CA",
    isUBE: false,
    passingScore: 1390, // California uses different scoring system 
    examDates: ["February", "July"],
    admissionOnMotion: false,
    notes: "Uses California Bar Examination (CBX), unique scoring system"
  },
  {
    id: 43,
    name: "Delaware",
    abbreviation: "DE",
    isUBE: false,
    passingScore: 276,
    examDates: ["February", "July"],
    admissionOnMotion: true,
    notes: "State-specific exam"
  },
  {
    id: 44,
    name: "Florida",
    abbreviation: "FL",
    isUBE: false,
    passingScore: 270,
    examDates: ["February", "July"],
    admissionOnMotion: false,
    notes: "Florida Bar Examination"
  },
  {
    id: 45,
    name: "Georgia",
    abbreviation: "GA",
    isUBE: false,
    passingScore: 270,
    examDates: ["February", "July"],
    admissionOnMotion: true,
    notes: "Uses Georgia Bar Examination"
  },
  {
    id: 46,
    name: "Hawaii",
    abbreviation: "HI",
    isUBE: false,
    passingScore: 270,
    examDates: ["February", "July"],
    admissionOnMotion: true,
    notes: "Tests MBE, MEE, and MPT but with Hawaii-specific components"
  },
  {
    id: 47,
    name: "Louisiana",
    abbreviation: "LA",
    isUBE: false,
    passingScore: 270,
    examDates: ["February", "July"],
    admissionOnMotion: false,
    notes: "Civil law jurisdiction, unique bar exam"
  },
  {
    id: 48,
    name: "Michigan",
    abbreviation: "MI",
    isUBE: false,
    passingScore: 270,
    examDates: ["February", "July"],
    admissionOnMotion: true,
    notes: "Michigan Bar Examination"
  },
  {
    id: 49,
    name: "Mississippi",
    abbreviation: "MS",
    isUBE: false,
    passingScore: 270,
    examDates: ["February", "July"],
    admissionOnMotion: true,
    notes: "Tests MBE, MEE, and MPT but with Mississippi-specific components"
  },
  {
    id: 50,
    name: "Nevada",
    abbreviation: "NV",
    isUBE: false,
    passingScore: 270,
    examDates: ["February", "July"],
    admissionOnMotion: true,
    notes: "Nevada Bar Examination"
  },
  {
    id: 51,
    name: "South Dakota",
    abbreviation: "SD",
    isUBE: false,
    passingScore: 270,
    examDates: ["February", "July"],
    admissionOnMotion: true,
    notes: "Tests MBE, MEE, and MPT but with South Dakota-specific components"
  },
  {
    id: 52,
    name: "Virginia",
    abbreviation: "VA",
    isUBE: false,
    passingScore: 270,
    examDates: ["February", "July"],
    admissionOnMotion: true,
    notes: "Virginia Bar Examination"
  },
  {
    id: 53,
    name: "Wisconsin",
    abbreviation: "WI",
    isUBE: false,
    passingScore: 270,
    examDates: ["February", "July"],
    admissionOnMotion: true,
    notes: "Tests MBE, MEE, and MPT but with Wisconsin-specific components"
  },

  // TERRITORIES - NON-UBE
  {
    id: 54,
    name: "Puerto Rico",
    abbreviation: "PR",
    isUBE: false,
    passingScore: 270,
    examDates: ["February", "July"],
    admissionOnMotion: false,
    notes: "Spanish and English language exam"
  },
  {
    id: 55,
    name: "Guam",
    abbreviation: "GU",
    isUBE: false,
    passingScore: 270,
    examDates: ["February", "July"],
    admissionOnMotion: false,
    notes: "Tests MBE, MEE, and MPT but with Guam-specific components"
  },
  {
    id: 56,
    name: "Northern Mariana Islands",
    abbreviation: "MP",
    isUBE: false,
    passingScore: 270,
    examDates: ["February", "July"],
    admissionOnMotion: false,
    notes: "Tests MBE, MEE, and MPT but with jurisdiction-specific components"
  }
];

async function populateJurisdictions() {
  const API_URL = process.env.STRAPI_API_URL || 'http://localhost:1337';
  const STRAPI_API_TOKEN = process.env.STRAPI_API_TOKEN;

  if (!STRAPI_API_TOKEN) {
    console.error('❌ STRAPI_API_TOKEN environment variable is required');
    process.exit(1);
  }

  console.log(`🚀 Starting bar jurisdictions population to ${API_URL}`);
  console.log(`📊 Total jurisdictions to populate: ${barJurisdictionsData.length}`);

  let created = 0;
  let updated = 0;
  let errors = 0;

  for (const jurisdiction of barJurisdictionsData) {
    try {
      // Check if jurisdiction already exists
      const checkResponse = await fetch(
        `${API_URL}/api/bar-jurisdictions?filters[abbreviation][$eq]=${jurisdiction.abbreviation}`,
        {
          headers: {
            'Authorization': `Bearer ${STRAPI_API_TOKEN}`,
            'Content-Type': 'application/json',
          },
        }
      );

      if (!checkResponse.ok) {
        throw new Error(`Check failed: ${checkResponse.status}`);
      }

      const existingData = await checkResponse.json();
      const existingJurisdiction = existingData.data?.[0];

      // Prepare the jurisdiction data for Strapi (remove frontend-specific fields)
      // Handle California's unique scoring system
      const passingScore = jurisdiction.abbreviation === 'CA' ? 270 : jurisdiction.passingScore;
      
      const strapiJurisdictionData = {
        name: jurisdiction.name,
        abbreviation: jurisdiction.abbreviation,
        isUBE: jurisdiction.isUBE,
        examDates: jurisdiction.examDates,
        barPassingScore: passingScore,
        reciprocityAgreements: []
      };

      if (existingJurisdiction) {
        // Update existing jurisdiction
        const updateResponse = await fetch(
          `${API_URL}/api/bar-jurisdictions/${existingJurisdiction.id}`,
          {
            method: 'PUT',
            headers: {
              'Authorization': `Bearer ${STRAPI_API_TOKEN}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              data: strapiJurisdictionData
            }),
          }
        );

        if (updateResponse.ok) {
          console.log(`✅ Updated: ${jurisdiction.name} (${jurisdiction.abbreviation})`);
          updated++;
        } else {
          const errorText = await updateResponse.text().catch(() => 'Unknown error');
          console.error(`❌ Update failed for ${jurisdiction.name}: ${updateResponse.status} - ${errorText}`);
          errors++;
        }
      } else {
        // Create new jurisdiction
        const createResponse = await fetch(`${API_URL}/api/bar-jurisdictions`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${STRAPI_API_TOKEN}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            data: strapiJurisdictionData
          }),
        });

        if (createResponse.ok) {
          console.log(`🆕 Created: ${jurisdiction.name} (${jurisdiction.abbreviation})`);
          created++;
        } else {
          const errorText = await createResponse.text().catch(() => 'Unknown error');
          console.error(`❌ Create failed for ${jurisdiction.name}: ${createResponse.status} - ${errorText}`);
          errors++;
        }
      }
    } catch (error) {
      console.error(`💥 Error processing ${jurisdiction.name}:`, error.message);
      errors++;
    }
  }

  console.log('\n📊 Population Summary:');
  console.log(`✨ Created: ${created}`);
  console.log(`🔄 Updated: ${updated}`);
  console.log(`❌ Errors: ${errors}`);
  console.log(`📈 Total: ${created + updated + errors}/${barJurisdictionsData.length}`);

  if (errors === 0) {
    console.log('\n🎉 All bar jurisdictions populated successfully!');
  } else {
    console.log(`\n⚠️  Population completed with ${errors} errors`);
    process.exit(1);
  }
}

// Run the population if this script is executed directly
if (require.main === module) {
  populateJurisdictions().catch((error) => {
    console.error('💥 Fatal error:', error);
    process.exit(1);
  });
}

module.exports = { populateJurisdictions, barJurisdictionsData };