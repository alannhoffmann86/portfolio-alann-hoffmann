# Portfolio - Backend Sécurisé pour Formulaire de Contact

Backend Node.js sécurisé pour gérer les envois d'emails du formulaire de contact du portfolio.

## 🔒 Sécurité

Les clés EmailJS sont maintenant stockées de manière sécurisée côté serveur, plus accessible depuis le code frontend.

### Fonctionnalités de sécurité :
- ✅ Clés API stockées dans fichier `.env` (non versionné sur Git)
- ✅ Validation des données du formulaire côté serveur
- ✅ Protection CORS (Cross-Origin Resource Sharing)
- ✅ Rate limiting (5 requêtes max par 15 minutes)
- ✅ Helmet.js pour sécuriser les headers HTTP
- ✅ Vérification reCAPTCHA côté serveur
- ✅ Sanitization des données (protection XSS)

## 📋 Prérequis

- Node.js (version 16 ou supérieure)
- npm ou yarn
- Compte EmailJS actif
- Clé reCAPTCHA de Google

## 🚀 Installation

### 1. Installer les dépendances

```bash
npm install
```

### 2. Configurer les variables d'environnement

Copier le fichier `.env.example` vers `.env` :

```bash
cp .env.example .env
```

Puis éditer le fichier `.env` avec vos vraies clés :

```env
# Configuration du serveur
PORT=3000
NODE_ENV=production

# URL autorisée pour CORS
ALLOWED_ORIGIN=http://localhost

# Clés EmailJS
EMAILJS_PUBLIC_KEY=votre_cle_publique
EMAILJS_PRIVATE_KEY=votre_cle_privee
EMAILJS_SERVICE_ID=votre_service_id
EMAILJS_TEMPLATE_ID=votre_template_id

# Email destinataire
RECIPIENT_EMAIL=votre@email.com

# Clé secrète reCAPTCHA
RECAPTCHA_SECRET_KEY=votre_cle_secrete
```

### 3. Obtenir les clés nécessaires

#### EmailJS :
1. Allez sur https://dashboard.emailjs.com/admin
2. Créez un service email
3. Créez un template
4. Récupérez vos clés (Public Key, Private Key, Service ID, Template ID)

#### reCAPTCHA :
1. Allez sur https://www.google.com/recaptcha/admin
2. Créez un nouveau site (reCAPTCHA v2)
3. Récupérez la clé secrète (Secret Key)

### 4. Configurer le template EmailJS

Dans votre template EmailJS, utilisez ces variables :
```
Nom: {{from_name}}
Email: {{from_email}}
Sujet: {{subject}}
Message: {{message}}
```

## 🎯 Utilisation

### Démarrer le serveur en mode développement

```bash
npm run dev
```

### Démarrer le serveur en mode production

```bash
npm start
```

Le serveur démarre sur `http://localhost:3000` par défaut.

## 🧪 Tester l'API

### Route de santé
```bash
curl http://localhost:3000/api/health
```

### Envoyer un email de test
```bash
curl -X POST http://localhost:3000/api/send-email \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Test User",
    "email": "test@example.com",
    "subject": "Test",
    "message": "Message de test",
    "recaptchaToken": "token_recaptcha"
  }'
```

## 📁 Structure du projet

```
portfolio/
├── server.js           # Serveur backend Express
├── package.json        # Dépendances du projet
├── .env               # Variables d'environnement (SECRET - ne pas commit)
├── .env.example       # Template des variables d'environnement
├── .gitignore         # Fichiers à ignorer par Git
├── index.html         # Page du portfolio
└── README.md          # Cette documentation
```

## 🌐 Déploiement en production

### Modifier l'URL de l'API dans index.html

Ligne 1483 du fichier `index.html` :
```javascript
const API_URL = 'https://votre-domaine.com/api/send-email';
```

### Variables d'environnement en production

Mettre à jour le fichier `.env` :
```env
PORT=3000
NODE_ENV=production
ALLOWED_ORIGIN=https://votre-domaine.com
```

### Plateformes de déploiement recommandées

- **Heroku** : Gratuit, facile à déployer
- **Vercel** : Idéal pour Node.js
- **Railway** : Alternative moderne
- **DigitalOcean** : VPS avec contrôle total

## 🔧 Configuration avancée

### Modifier le rate limiting

Dans `server.js` ligne 26-32 :
```javascript
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // Nombre max de requêtes
  message: 'Trop de tentatives...'
});
```

### Ajouter d'autres domaines autorisés (CORS)

Dans `server.js` ligne 16-20 :
```javascript
const corsOptions = {
  origin: ['https://domaine1.com', 'https://domaine2.com'],
  optionsSuccessStatus: 200
};
```

## 🐛 Dépannage

### Le serveur ne démarre pas
- Vérifier que Node.js est installé : `node --version`
- Vérifier que les dépendances sont installées : `npm install`
- Vérifier que le port 3000 n'est pas déjà utilisé

### Erreur CORS
- Vérifier que `ALLOWED_ORIGIN` dans `.env` correspond à l'URL de votre site
- En développement local, utiliser : `http://localhost` ou `http://127.0.0.1`

### Emails non envoyés
- Vérifier que toutes les clés EmailJS sont correctes dans `.env`
- Tester les clés directement sur le dashboard EmailJS
- Vérifier les logs du serveur pour les erreurs détaillées

### Rate limiting trop restrictif
- Augmenter la valeur `max` dans la configuration du rate limiter
- Augmenter `windowMs` pour une fenêtre de temps plus longue

## 📝 Logs et monitoring

Les logs du serveur affichent :
- Démarrage du serveur
- Requêtes reçues
- Erreurs d'envoi d'email
- Tentatives bloquées par rate limiting

## 🔐 Bonnes pratiques de sécurité

1. **JAMAIS** commiter le fichier `.env` sur Git
2. Utiliser des clés différentes pour dev et production
3. Renouveler régulièrement les clés API
4. Monitorer les logs pour détecter les abus
5. Activer HTTPS en production
6. Mettre à jour régulièrement les dépendances : `npm audit`

## 📞 Support

Pour toute question ou problème :
- Email : alannhoffmann86@gmail.com
- Vérifier les issues GitHub du projet

## 📄 Licence

MIT License - Libre d'utilisation et de modification
