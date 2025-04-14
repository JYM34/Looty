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
  