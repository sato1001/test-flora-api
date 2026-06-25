import { prisma } from '../src/database/prisma';
import { logger } from '../src/logger';

const DICTIONARY_URL = 'https://raw.githubusercontent.com/dwyl/english-words/master/words_dictionary.json';

async function importDictionary(): Promise<void> {
  logger.info('Starting dictionary import process...');

  let words: string[] = [];

  try {
    logger.info(`Downloading dictionary from: ${DICTIONARY_URL}`);
    const response = await fetch(DICTIONARY_URL);
    if (!response.ok) {
      throw new Error(`Failed to download dictionary. Status: ${response.status}`);
    }
    const data = (await response.json()) as Record<string, number>;
    words = Object.keys(data);
    logger.info(`Successfully downloaded dictionary. Found ${words.length} words.`);
  } catch (error: any) {
    logger.error(
      { error: error.message || error },
      'Failed to download dictionary from remote source. Using fallback mock words list.'
    );
    // Offline/Fallback list of words to make it run reliably anywhere
    words = [
      'apple', 'apricot', 'banana', 'cherry', 'date', 'elderberry', 'fig', 'grape', 'honeydew',
      'kiwi', 'lemon', 'mango', 'nectarine', 'orange', 'papaya', 'quince', 'raspberry',
      'strawberry', 'tangerine', 'ugli', 'vanilla', 'watermelon', 'xigua', 'yuzu', 'zucchini'
    ];
  }

  const batchSize = 10000;
  let importedCount = 0;

  for (let i = 0; i < words.length; i += batchSize) {
    const batch = words.slice(i, i + batchSize).map((word) => ({
      word: word.trim().toLowerCase(),
    }));

    try {
      const result = await prisma.dictionaryWord.createMany({
        data: batch,
        skipDuplicates: true,
      });
      importedCount += result.count;
      logger.info(
        `Processed batch ${Math.floor(i / batchSize) + 1}/${Math.ceil(
          words.length / batchSize
        )}: inserted ${result.count} new words.`
      );
    } catch (error) {
      logger.error({ error }, 'Error inserting word batch');
    }
  }

  logger.info(`Dictionary import finished. Total new words inserted: ${importedCount}`);
}

importDictionary()
  .catch((err) => {
    logger.error({ err }, 'Unhandled error in dictionary importer');
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
