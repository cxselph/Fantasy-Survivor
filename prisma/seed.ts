import "dotenv/config";
import { PrismaClient } from "../src/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });

const SEASON_51_CAST = [
  { name: "Devin Way", bio: "Actor" },
  { name: "Ana Sani", bio: "Voice actress" },
  { name: "Brady Booker", bio: "Former WWE professional wrestler" },
  { name: "Mike Pinsky", bio: "Assistant Director of Baseball Operations, New York Yankees" },
  { name: "Carter Krull", bio: "Livestock farmer from Iowa" },
  { name: "Lewis Kelly", bio: "Farmer living in Puerto Rico (originally from Dublin, Ireland)" },
  { name: "Maggie Nestor", bio: "Farmer and homeschool teacher from West Virginia" },
  { name: "Aaliyah Puglia", bio: "Chef from New Jersey" },
  { name: "Alexis Levine", bio: "Criminal defense attorney" },
  { name: "Patt Cannaday", bio: "Federal prosecutor" },
  { name: "Sharonda Cox", bio: "OB/GYN resident" },
  { name: "Kristin Flickinger", bio: "Crisis management consultant" },
  { name: "Eric Macksoud", bio: "Mental health counselor" },
  { name: "Jenna Doore", bio: "Wedding photographer" },
  { name: "Cristian Chavez", bio: "Head of HR" },
  { name: "Danny “Kilby” Kilby", bio: "Video game designer" },
  { name: "An “Thien An” Nguyen", bio: "Medical student" },
  { name: "Linnea Capobianco", bio: "Entrepreneur" },
  { name: "Angelica “Jelly” Loblack", bio: "Sociology professor" },
  { name: "Rob Antonson", bio: "Airline gate agent" },
  { name: "Ori Jean-Charles", bio: "Personal trainer" },
];

async function main() {
  const season = await prisma.season.upsert({
    where: { number: 51 },
    update: {},
    create: {
      number: 51,
      name: "The Open Era",
      isActive: true,
    },
  });

  for (const [index, castaway] of SEASON_51_CAST.entries()) {
    await prisma.castaway.upsert({
      where: { seasonId_name: { seasonId: season.id, name: castaway.name } },
      update: {},
      create: {
        seasonId: season.id,
        name: castaway.name,
        bio: castaway.bio,
        sortOrder: index,
      },
    });
  }

  console.log(`Seeded Season ${season.number}: ${SEASON_51_CAST.length} castaways.`);
}

main()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
