import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

interface DoctorProfileWithClinic {
  id: string;
  cabinetName: string | null;
  cabinetGender: string | null;
  clinicAddress: string | null;
  clinicAddress2: string | null;
  clinicPostalCode: string | null;
  clinicCity: string | null;
  clinicPhone: string | null;
  prmAccess: boolean | null;
  videoSurveillance: boolean | null;
}

async function migrateClinicData() {
  console.log('Starting clinic data migration...');

  try {
    // Get all doctor profiles with clinic data
    const doctorProfiles = await prisma.$queryRaw<DoctorProfileWithClinic[]>`
      SELECT id, cabinetName, cabinetGender, clinicAddress, clinicAddress2, 
             clinicPostalCode, clinicCity, clinicPhone, prmAccess, videoSurveillance
      FROM doctor_profiles
      WHERE cabinetName IS NOT NULL 
         OR clinicAddress IS NOT NULL 
         OR clinicCity IS NOT NULL
    `;

    console.log(
      `Found ${doctorProfiles.length} doctor profiles with clinic data`,
    );

    // Migrate data to clinic table
    for (const profile of doctorProfiles) {
      try {
        await prisma.clinic.create({
          data: {
            doctorProfileId: profile.id,
            name: profile.cabinetName,
            gender: profile.cabinetGender,
            address: profile.clinicAddress,
            address2: profile.clinicAddress2,
            postalCode: profile.clinicPostalCode,
            city: profile.clinicCity,
            phone: profile.clinicPhone,
            prmAccess: profile.prmAccess || false,
            videoSurveillance: profile.videoSurveillance || false,
          },
        });
        console.log(`✓ Migrated clinic data for doctor profile: ${profile.id}`);
      } catch (error) {
        // Skip if clinic already exists
        if (error.code === 'P2002') {
          console.log(
            `⊘ Clinic already exists for doctor profile: ${profile.id}`,
          );
        } else {
          console.error(
            `✗ Error migrating clinic data for profile ${profile.id}:`,
            error,
          );
        }
      }
    }

    console.log('Clinic data migration completed successfully!');
  } catch (error) {
    console.error('Error during migration:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

migrateClinicData().catch((error) => {
  console.error('Migration failed:', error);
  process.exit(1);
});
