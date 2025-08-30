#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

/**
 * Script pour copier les prédictions améliorées dans le dossier public
 */

function copyImprovedPredictions() {
    const sourcePath = path.join(__dirname, '..', 'data', 'improved_predictions.json');
    const targetPath = path.join(__dirname, '..', 'public', 'data', 'improved_predictions.json');
    
    // Vérifier si le fichier source existe
    if (!fs.existsSync(sourcePath)) {
        console.log('❌ Fichier source non trouvé:', sourcePath);
        console.log('💡 Exécutez d\'abord: npm run test:real-predictions');
        return;
    }
    
    // Créer le dossier de destination s'il n'existe pas
    const targetDir = path.dirname(targetPath);
    if (!fs.existsSync(targetDir)) {
        fs.mkdirSync(targetDir, { recursive: true });
        console.log('📁 Dossier créé:', targetDir);
    }
    
    try {
        // Copier le fichier
        fs.copyFileSync(sourcePath, targetPath);
        console.log('✅ Fichier copié avec succès!');
        console.log('📁 Source:', sourcePath);
        console.log('📁 Destination:', targetPath);
        
        // Vérifier la taille du fichier
        const stats = fs.statSync(targetPath);
        console.log('📊 Taille:', (stats.size / 1024).toFixed(2), 'KB');
        
    } catch (error) {
        console.error('❌ Erreur lors de la copie:', error.message);
    }
}

// Exécuter le script
copyImprovedPredictions();
