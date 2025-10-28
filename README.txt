Beard Boyz — quick start
==========================

A tiny, mobile-friendly browser game. Guess whose mustache & beard are shown.
You have 5 seconds per picture. Tap the name at the bottom. Correct = applause + confetti.
Wrong = buzzer + big X. After 8 photos, your total score appears. Tap "Play Again" to restart.

How to use
----------
1) Upload the whole folder to your web server (or open index.html directly).
2) Replace the 8 placeholder images in: assets/images/img1.png ... img8.png
3) Update names and image paths inside script.js (NAMES and DATA arrays). Make sure they match 1:1.

Notes
-----
- All effects (confetti, buzzer/applause) work offline with no external libs.
- Layout is mobile-first; name buttons become a 4-column grid on wider screens.
- Timer is 5 seconds by default — change ROUND_TIME in script.js if you like.

Have fun!
