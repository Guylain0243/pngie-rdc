// Limiteur de débit anti brute-force. En mémoire locale (Map), la limite ne vaut
// que PAR INSTANCE de serveur — avec N instances derrière un répartiteur de charge,
// un attaquant (ou une rafale de connexions légitimes) obtient N× la limite réelle,
// et rien n'est partagé entre elles. C'est un vrai bug pour un déploiement à plusieurs
// instances, pas une nuance théorique.
//
// Dès que REDIS_URL est définie, le compteur est stocké dans Redis — partagé par
// toutes les instances, donc la limite de 10 tentatives/15min est une VRAIE limite
// globale, quel que soit le nombre de serveurs derrière le répartiteur de charge.
const useRedis = !!process.env.REDIS_URL;

let checkLimit;

if (useRedis) {
  const Redis = require('ioredis');
  const redis = new Redis(process.env.REDIS_URL);

  checkLimit = async (key, max = 10, windowSeconds = 900) => {
    const redisKey = `ratelimit:${key}`;
    // INCR + EXPIRE atomiques via une transaction — évite une fenêtre de course
    // où deux requêtes concurrentes liraient le même compteur avant incrémentation.
    const tx = redis.multi().incr(redisKey).expire(redisKey, windowSeconds, 'NX');
    const [[, count]] = await tx.exec();
    return count > max;
  };
} else {
  const attempts = new Map(); // clé -> [timestamps]
  checkLimit = async (key, max = 10, windowSeconds = 900) => {
    const now = Date.now();
    const arr = (attempts.get(key) || []).filter(t => now - t < windowSeconds * 1000);
    arr.push(now);
    attempts.set(key, arr);
    return arr.length > max;
  };
}

module.exports = { checkLimit, driver: useRedis ? 'redis' : 'memory' };
