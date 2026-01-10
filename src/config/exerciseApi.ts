// Configuration for Exercise API
// Supports self-hosted ExerciseDB API or public API

// Base URL for your own ExerciseDB API (deployed on Vercel, Railway, etc.)
// Set VITE_EXERCISE_API_URL in environment variables to use your own API
export const EXERCISE_API_URL = import.meta.env.VITE_EXERCISE_API_URL 
  || 'https://www.exercisedb.dev/api/v1';

// GIF Base URL - uses the same host as the API
export const GIF_BASE_URL = import.meta.env.VITE_EXERCISE_API_URL
  ? `${import.meta.env.VITE_EXERCISE_API_URL}/image/`
  : 'https://v2.exercisedb.io/image/';

// Check if using custom API
export const isUsingCustomApi = !!import.meta.env.VITE_EXERCISE_API_URL;

// API Endpoints
export const API_ENDPOINTS = {
  search: (query: string, limit = 10) => 
    `${EXERCISE_API_URL}/exercises/search?q=${encodeURIComponent(query)}&limit=${limit}`,
  
  getById: (id: string) => 
    `${EXERCISE_API_URL}/exercises/${id}`,
  
  getByName: (name: string) => 
    `${EXERCISE_API_URL}/exercises/name/${encodeURIComponent(name)}`,
  
  listAll: (offset = 0, limit = 100) => 
    `${EXERCISE_API_URL}/exercises?offset=${offset}&limit=${limit}`,
  
  getByBodyPart: (bodyPart: string) => 
    `${EXERCISE_API_URL}/exercises/bodyPart/${encodeURIComponent(bodyPart)}`,
  
  getByTarget: (target: string) => 
    `${EXERCISE_API_URL}/exercises/target/${encodeURIComponent(target)}`,
  
  getByEquipment: (equipment: string) => 
    `${EXERCISE_API_URL}/exercises/equipment/${encodeURIComponent(equipment)}`,
  
  getGifUrl: (exerciseId: string) => 
    `${GIF_BASE_URL}${exerciseId}.gif`,
};

// Pagination config for syncing all exercises
export const SYNC_CONFIG = {
  batchSize: 100,
  maxExercises: 5000,
  delayBetweenBatches: 100, // ms
};
