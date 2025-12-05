document.getElementById('leadForm').addEventListener('submit', async (e) => {
    e.preventDefault();
  
    const data = new FormData(e.target);
    const json = Object.fromEntries(data.entries());
  
    try {
      await fetch('https://hooks.zapier.com/hooks/catch/000000/placeholder', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(json)
      });
  
      alert('Your information has been submitted! We will contact you shortly.');
      e.target.reset();
    } catch (err) {
      alert('There was an issue submitting your form. Please try again.');
    }
  });
  