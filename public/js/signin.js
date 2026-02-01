document.addEventListener('DOMContentLoaded', function(){
  const form = document.getElementById('signin-form');
  const first = document.getElementById('firstName');
  const last = document.getElementById('lastName');
  const err = document.getElementById('signin-error');

  form.addEventListener('submit', function(e){
    // Trim inputs
    first.value = first.value.trim();
    last.value = last.value.trim();

    if(!first.value || !last.value){
      e.preventDefault();
      err.textContent = 'Please enter both your first and last name.';
      err.style.display = 'block';
      if(!first.value) first.focus();
      return false;
    }

    // Simple name validation (letters, spaces, hyphens)
    const namePattern = /^[A-Za-z\s\-']{2,}$/;
    if(!namePattern.test(first.value) || !namePattern.test(last.value)){
      e.preventDefault();
      err.textContent = 'Please use only letters, spaces, hyphens or apostrophes for names.';
      err.style.display = 'block';
      return false;
    }

    // Hide error and allow submit
    err.style.display = 'none';
    return true;
  });
});