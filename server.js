require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const { body, validationResult } = require('express-validator');
const emailjs = require('@emailjs/nodejs');

const app = express();
const PORT = process.env.PORT || 3000;

// Sécurité : Helmet pour protéger contre les vulnérabilités courantes
app.use(helmet());

// CORS : Autoriser uniquement votre domaine
const corsOptions = {
  origin: process.env.ALLOWED_ORIGIN || 'http://localhost',
  optionsSuccessStatus: 200
};
app.use(cors(corsOptions));

// Parser JSON
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Rate limiting : 5 requêtes max par 15 minutes par IP
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // Limite de 5 requêtes
  message: 'Trop de tentatives d\'envoi. Veuillez réessayer dans 15 minutes.',
  standardHeaders: true,
  legacyHeaders: false,
});

app.use('/api/send-email', limiter);

// Validation du formulaire
const validateContactForm = [
  body('name')
    .trim()
    .isLength({ min: 2, max: 100 })
    .withMessage('Le nom doit contenir entre 2 et 100 caractères')
    .escape(),
  body('email')
    .trim()
    .isEmail()
    .normalizeEmail()
    .withMessage('Email invalide'),
  body('subject')
    .trim()
    .isLength({ min: 3, max: 200 })
    .withMessage('Le sujet doit contenir entre 3 et 200 caractères')
    .escape(),
  body('message')
    .trim()
    .isLength({ min: 10, max: 2000 })
    .withMessage('Le message doit contenir entre 10 et 2000 caractères')
    .escape(),
  body('recaptchaToken')
    .notEmpty()
    .withMessage('Le reCAPTCHA est requis')
];

// Route principale
app.get('/', (req, res) => {
  res.json({
    status: 'ok',
    message: 'API de contact du portfolio - Service actif'
  });
});

// Route de test de santé
app.get('/api/health', (req, res) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString()
  });
});

// Route d'envoi d'email
app.post('/api/send-email', validateContactForm, async (req, res) => {
  // Vérifier les erreurs de validation
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      errors: errors.array()
    });
  }

  const { name, email, subject, message, recaptchaToken } = req.body;

  try {
    // Vérifier le reCAPTCHA
    const recaptchaResponse = await fetch('https://www.google.com/recaptcha/api/siteverify', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: `secret=${process.env.RECAPTCHA_SECRET_KEY}&response=${recaptchaToken}`
    });

    const recaptchaData = await recaptchaResponse.json();

    if (!recaptchaData.success) {
      return res.status(400).json({
        success: false,
        message: 'Échec de la vérification reCAPTCHA'
      });
    }

    // Préparer les paramètres pour EmailJS
    const templateParams = {
      from_name: name,
      from_email: email,
      subject: subject,
      message: message,
      to_email: process.env.RECIPIENT_EMAIL || 'alannhoffmann86@gmail.com'
    };

    // Envoyer l'email via EmailJS
    const response = await emailjs.send(
      process.env.EMAILJS_SERVICE_ID,
      process.env.EMAILJS_TEMPLATE_ID,
      templateParams,
      {
        publicKey: process.env.EMAILJS_PUBLIC_KEY,
        privateKey: process.env.EMAILJS_PRIVATE_KEY,
      }
    );

    console.log('Email envoyé avec succès:', response.status, response.text);

    res.json({
      success: true,
      message: 'Message envoyé avec succès !'
    });

  } catch (error) {
    console.error('Erreur lors de l\'envoi de l\'email:', error);

    res.status(500).json({
      success: false,
      message: 'Erreur lors de l\'envoi du message. Veuillez réessayer plus tard.'
    });
  }
});

// Gestion des routes non trouvées
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: 'Route non trouvée'
  });
});

// Gestion des erreurs globales
app.use((err, req, res, next) => {
  console.error('Erreur serveur:', err.stack);
  res.status(500).json({
    success: false,
    message: 'Erreur interne du serveur'
  });
});

// Démarrer le serveur
app.listen(PORT, () => {
  console.log(`\n🚀 Serveur backend démarré avec succès !`);
  console.log(`📡 Port: ${PORT}`);
  console.log(`🌍 URL: http://localhost:${PORT}`);
  console.log(`🔒 Sécurité: Rate limiting activé (5 req/15min)`);
  console.log(`\n✅ Prêt à recevoir des requêtes\n`);
});
