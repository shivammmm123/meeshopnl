

const DB_NAME = 'meesho-analytics-db';
const DB_VERSION = 1;
const STORE_NAME = 'keyval';

// This function promisifies an IDBRequest.
const promisifyRequest = <T>(request: IDBRequest<T>): Promise<T> => {
  return new Promise((resolve, reject) => {
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
};

// Singleton to hold the database connection promise.
let dbPromise: Promise<IDBDatabase> | null = null;

const getDb = (): Promise<IDBDatabase> => {
  if (!dbPromise) {
    dbPromise = new Promise((resolve, reject) => {
      const request = indexedDB.open(DB_NAME, DB_VERSION);

      request.onerror = () => {
        console.error('IndexedDB error:', request.error);
        reject('IndexedDB error: ' + request.error);
      };

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;
        if (!db.objectStoreNames.contains(STORE_NAME)) {
          db.createObjectStore(STORE_NAME);
        }
      };

      request.onsuccess = () => {
        const db = request.result;
        // Handle connection closing unexpectedly
        db.onclose = () => {
            dbPromise = null;
            console.log('Database connection closed.');
        };
        resolve(db);
      };
    });
  }
  return dbPromise;
};

/**
 * Gets a value from the database by its key.
 * @template T The expected type of the value.
 * @param {string} key The key of the item to retrieve.
 * @returns {Promise<T | undefined>} The value if found, otherwise undefined.
 */
export const get = async <T>(key: string): Promise<T | undefined> => {
  const db = await getDb();
  const transaction = db.transaction(STORE_NAME, 'readonly');
  const store = transaction.objectStore(STORE_NAME);
  return promisifyRequest<T | undefined>(store.get(key));
};

/**
 * Sets a value in the database for a given key.
 * @param {string} key The key of the item to set.
 * @param {*} value The value to store.
 */
export const set = async (key: string, value: any): Promise<void> => {
  const db = await getDb();
  const transaction = db.transaction(STORE_NAME, 'readwrite');
  transaction.objectStore(STORE_NAME).put(value, key);

  await new Promise<void>((resolve, reject) => {
    transaction.oncomplete = () => resolve();
    transaction.onerror = () => reject(transaction.error);
  });
};

/**
 * Deletes a value from the database by its key.
 * @param {string} key The key of the item to delete.
 */
export const del = async (key:string): Promise<void> => {
    const db = await getDb();
    const transaction = db.transaction(STORE_NAME, 'readwrite');
    transaction.objectStore(STORE_NAME).delete(key);

    await new Promise<void>((resolve, reject) => {
        transaction.oncomplete = () => resolve();
        transaction.onerror = () => reject(transaction.error);
    });
}

/**
 * Clears all data from the object store.
 */
export const clear = async (): Promise<void> => {
  const db = await getDb();
  const transaction = db.transaction(STORE_NAME, 'readwrite');
  transaction.objectStore(STORE_NAME).clear();

  await new Promise<void>((resolve, reject) => {
    transaction.oncomplete = () => resolve();
    transaction.onerror = () => reject(transaction.error);
  });
};