document.addEventListener('DOMContentLoaded', () => {
  const btnStart = document.getElementById('btn-start');
  const btnLearn = document.getElementById('btn-learn');

  if (btnStart) {
    btnStart.addEventListener('click', () => {
      // Direct user into using the extension and close onboarding tab
      window.close();
    });
  }

  if (btnLearn) {
    btnLearn.addEventListener('click', () => {
      chrome.runtime.openOptionsPage();
    });
  }
});
