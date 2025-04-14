document.addEventListener('DOMContentLoaded', () => {
    const links = document.querySelectorAll('.tab-link');
    const tabs = document.querySelectorAll('.tab-content');
  
    links.forEach(link => {
      link.addEventListener('click', function (e) {
        e.preventDefault();
  
        tabs.forEach(tab => tab.classList.remove('active'));
        links.forEach(l => l.classList.remove('active'));
  
        const targetId = this.getAttribute('href').substring(1);
        const target = document.getElementById(targetId);
  
        if (target) {
          target.classList.add('active');
          this.classList.add('active');
          history.replaceState(null, null, `#${targetId}`);
        }
      });
    });
  
    const currentHash = window.location.hash;
    if (currentHash) {
      const target = document.querySelector(currentHash);
      const link = document.querySelector(`.tab-link[href="${currentHash}"]`);
  
      if (target && link) {
        tabs.forEach(tab => tab.classList.remove('active'));
        links.forEach(l => l.classList.remove('active'));
  
        target.classList.add('active');
        link.classList.add('active');
      }
    }
  });
  document.addEventListener("DOMContentLoaded", () => {
    const epicForm = document.querySelector('#bloc-epic form');

    epicForm.addEventListener("submit", (e) => {
      const country = document.getElementById("country").value.trim();
      const locale = document.getElementById("locale").value.trim();

      const allowedCountries = ["FR", "US", "GB", "DE", "IT", "ES", "BR", "CA", "JP", "RU", "MX", "KR", "AU", "CN", "IN"];
      const allowedLocales = ["fr-FR", "en-US", "en-GB", "de-DE", "it-IT", "es-ES", "pt-BR", "ja-JP", "ru-RU", "ko-KR", "zh-CN", "zh-Hant"];

      // 🔒 Vérifie que les valeurs sont valides
      if (!allowedCountries.includes(country) || !allowedLocales.includes(locale)) {
        e.preventDefault(); // empêche l’envoi du formulaire

        alert("❌ Veuillez sélectionner un pays et une langue valides dans les menus déroulants.");
      }
    });
  });
  