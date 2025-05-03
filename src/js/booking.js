import myHelpers from './helper.js';
const base = import.meta.env.BASE_URL;

// ✅ Ping Render backend early
fetch('https://mariastudio-backend.onrender.com/ping')
  .then(() => console.log("🟢 Render server pinged"))
  .catch(() => console.warn("⚠️ Could not ping backend"));

document.addEventListener('modalOpened', () => {
  const input = document.querySelector("#phone");
  window.intlTelInput(input, {
    loadUtils: () => import("https://cdn.jsdelivr.net/npm/intl-tel-input@25.2.1/build/js/utils.js"),
    initialCountry: "auto",
    geoIpLookup: (success, failure) => {
      fetch("https://ipapi.co/json")
        .then((res) => res.json())
        .then((data) => success(data.country_code))
        .catch(() => failure());
    },
    nationalMode: false,
    strictMode: true
  });;

  const yesRadio = document.getElementById('firsttime-yes');
  const noRadio = document.getElementById('firsttime-no');
  if (yesRadio) {
    yesRadio.addEventListener('click', toggleFirstTimeBooking);
  }
  if (noRadio) {
    noRadio.addEventListener('click', toggleFirstTimeBooking);
  }

  const projectTypeDropdown = document.getElementById('project-type');
  if (projectTypeDropdown) {
    projectTypeDropdown.addEventListener('change', toggleInputsBasedOnProjectType);
  }

  const equipmentListReadyYes = document.getElementById('equipmentlistreadyyes');
  const equipmentListReadyNo = document.getElementById('equipmentlistreadyno');
  if (equipmentListReadyYes) {
    equipmentListReadyYes.addEventListener('click', toggleEQListFields);
  }
  if (equipmentListReadyNo) {
    equipmentListReadyNo.addEventListener('click', toggleEQListFields);
  }

  const billingDetailsSame = document.getElementById('billingdetails-same');
  const billingDetailsNew = document.getElementById('billingdetails-new');
  if (billingDetailsSame) {
    billingDetailsSame.addEventListener('click', toggleBillingDetails);
  }
  if (billingDetailsNew) {
    billingDetailsNew.addEventListener('click', toggleBillingDetails);
  }

  initializeBookingForm();
  // initializeDatePickers();
});

function toggleFirstTimeBooking() {
  const yesRadio = document.getElementById('firsttime-yes');
  const noRadio = document.getElementById('firsttime-no');
  const imgYes = document.getElementById('img-yes');
  const imgNo = document.getElementById('img-no');
  const youAreaContainer = document.getElementById('youarea-container');
  // const billingDetailsOptions = document.getElementById('billing-details-options');
  const billingDetailsContainer = document.getElementById('billing-details-container');
  const billingDetailsSame = document.getElementById('billingdetails-same');

  if (yesRadio.checked) {
    imgYes.src = base + '/radio_button_checked.png';
    imgNo.src = base + '/radio_button_unchecked.png';
    youAreaContainer.classList.remove('hidden');
    // billingDetailsOptions.classList.add('hidden');
    billingDetailsContainer.classList.remove('hidden');
    billingDetailsSame.checked = true; // Preselect "Same Billing details as usual"
  } else if (noRadio.checked) {
    imgYes.src = base + '/radio_button_unchecked.png';
    imgNo.src = base + '/radio_button_checked.png';
    youAreaContainer.classList.add('hidden');
    // billingDetailsOptions.classList.remove('hidden');
    billingDetailsContainer.classList.add('hidden'); // Hide initially until an option is selected
  }
}

function toggleInputsBasedOnProjectType() {
  const projectType = document.getElementById('project-type').value;
  const photographerContainer = document.getElementById('photographer-container');
  const brandNameContainer = document.getElementById('brandname-container');
  const magazineNameContainer = document.getElementById('magazinename-container');
  const tellUsMoreContainer = document.getElementById('tellusmore-container');

  // Show or hide Photographer based on project type
  if (projectType === 'Ecommerce') {
    photographerContainer.classList.add('hidden');
  } else {
    photographerContainer.classList.remove('hidden');
  }

  // Show or hide Brand name based on project type
  if (projectType === 'Campaign' || projectType === 'Lookbook' || projectType === 'Ecommerce') {
    brandNameContainer.classList.remove('hidden');
  } else {
    brandNameContainer.classList.add('hidden');
  }

  // Show or hide Magazine name based on project type
  if (projectType === 'Editorial') {
    magazineNameContainer.classList.remove('hidden');
  } else {
    magazineNameContainer.classList.add('hidden');
  }

  // Show or hide Tell us more based on project type
  if (projectType === 'Personal' || projectType === 'Other') {
    tellUsMoreContainer.classList.remove('hidden');
  } else {
    tellUsMoreContainer.classList.add('hidden');
  }
}

function toggleEQListFields() {
  const equipmentListReadyYes = document.getElementById('equipmentlistreadyyes');
  const equipmentListReadyNo = document.getElementById('equipmentlistreadyno');
  const eqImgYes = document.getElementById('eq-img-yes');
  const eqImgNo = document.getElementById('eq-img-no');
  const eqlistContainer = document.getElementById('eqlist-container');

  if (equipmentListReadyYes.checked) {
      eqImgYes.src = base + '/radio_button_checked.png';
      eqImgNo.src = base + '/radio_button_unchecked.png';
      eqlistContainer.classList.remove('hidden');
  } else if (equipmentListReadyNo.checked) {
      eqImgYes.src = base + '/radio_button_unchecked.png';
      eqImgNo.src = base + '/radio_button_checked.png';
      eqlistContainer.classList.add('hidden');
  }
}

function toggleBillingDetails() {
  const billingDetailsSame = document.getElementById('billingdetails-same');
  const billingDetailsNew = document.getElementById('billingdetails-new');
  const billingImgSame = document.getElementById('billing-img-same');
  const billingImgNew = document.getElementById('billing-img-new');
  const billingDetailsContainer = document.getElementById('billing-details-container');

  if (billingDetailsSame.checked) {
      billingImgSame.src = base + '/radio_button_checked.png';
      billingImgNew.src = base + '/radio_button_unchecked.png';
      billingDetailsContainer.classList.add('hidden');
  } else if (billingDetailsNew.checked) {
      billingImgSame.src = base + '/radio_button_unchecked.png';
      billingImgNew.src = base + '/radio_button_checked.png';
      billingDetailsContainer.classList.remove('hidden');
  }
}

function initializeDatePickers() {

  const appointmentDates = document.getElementById('appointment-dates');
  const today = new Date();
  const yyyy = today.getFullYear();
  const mm   = String(today.getMonth() + 1).padStart(2, '0'); // months are 0-based
  const dd   = String(today.getDate()).padStart(2, '0');

  // e.g. "2025-01-08"
  const formattedToday = `${yyyy}-${mm}-${dd}`;

  // Only set the placeholder, not the actual value
  appointmentDates.placeholder = formattedToday;

  flatpickr("#appointment-dates", {
    mode: "multiple",
    dateFormat: "Y-m-d",
  });
}


function initializeBookingForm() {
  initializeDatePickers();
  const nextBtn1 = document.getElementById('nextBtn1');
  const nextBtn2 = document.getElementById('nextBtn2');
  const backBtn2 = document.getElementById('backBtn2');
  const backBtn3 = document.getElementById('backBtn3');
  const submitBtn = document.querySelector('#form-part-03 button[type="submit"]');

  if (nextBtn1) {
    nextBtn1.removeEventListener('click', handleNextBtn1); // Ensure no duplicate event listeners
    nextBtn1.addEventListener('click', handleNextBtn1);
  }
  if (nextBtn2) {
    nextBtn2.removeEventListener('click', handleNextBtn2); // Ensure no duplicate event listeners
    nextBtn2.addEventListener('click', handleNextBtn2);
  }
  if (backBtn2) {
    backBtn2.removeEventListener('click', handleBackBtn2); // Ensure no duplicate event listeners
    backBtn2.addEventListener('click', handleBackBtn2);
  }
  if (backBtn3) {
    backBtn3.removeEventListener('click', handleBackBtn3); // Ensure no duplicate event listeners
    backBtn3.addEventListener('click', handleBackBtn3);
  }
  if (submitBtn) {
    submitBtn.removeEventListener('click', handleFormSubmit); // Ensure no duplicate event listeners
    submitBtn.addEventListener('click', handleFormSubmit);
  }
}


function handleNextBtn1() {
  const formPart1 = document.getElementById('form-part-01');
  if (validateForm(formPart1)) {
    showNextPart(1);
    enableSwiping()
  
    // let modalFooterPlaceholder = document.getElementsByClassName('modal-footer-placeholder');
    // if (modalFooterPlaceholder.length > 0 && isMobile()) {
    //   console.log('ismobile');
    //   modalFooterPlaceholder[0].style.position = 'static';
    // let targetElement = document.getElementById('form-part-02');
    // if (targetElement) {
    //   targetElement.scrollIntoView({ behavior: 'smooth', block: 'start' });
    // }
    // }
  }
}

function handleNextBtn2() {
  const formPart2 = document.getElementById('form-part-02');
  if (validateForm(formPart2)) {
    showNextPart(2);
  }
}

function handleBackBtn2() {
  showPreviousPart(2);
}

function handleBackBtn3() {
  showPreviousPart(3);
}

function handleFormSubmit(event) {
  //testing
  event.preventDefault(); // Prevent form submission and page reload

  const formPart3 = document.getElementById('form-part-03');
  if (validateForm(formPart3)) {
    logFormData();  // Log the form data here after validation
    // Here you can also manually trigger an AJAX call to submit the form if needed
  }

  /*
  const formPart3 = document.getElementById('form-part-03');
  if (validateForm(formPart3)) {
    logFormData();  // Log the form data here after validation
  } else {
    event.preventDefault(); // Prevent form submission if the form is not valid
  }*/
}

function showNextPart(currentPart) {
  const currentForm = document.getElementById(`form-part-0${currentPart}`);
  const currentBook = document.getElementById(`main-book-0${currentPart}`);
  if (currentForm && validateForm(currentForm)) {
    const nextBook = document.getElementById(`main-book-0${currentPart + 1}`);
    if (nextBook) {
      nextBook.style.display = 'block';
        if (myHelpers.isMobile() === true) {
          currentBook.style.display = 'none';
          let backBtn = document.getElementById(`backBtn${currentPart + 1}`);
          backBtn.style.display = 'inline-block';
        }
    }
  }
}

function showPreviousPart(currentPart) {
  const currentBook = document.getElementById(`main-book-0${currentPart}`);
  if (currentBook) {
    const previousBook = document.getElementById(`main-book-0${currentPart -1}`);
    if (previousBook) {
      previousBook.style.display = 'block';
      currentBook.style.display = 'none';
    }
  }
}

// function validateForm(form) {
//   let valid = true;

//   // Validate required input, select, and textarea elements
//   const inputs = form.querySelectorAll('input[required], select[required], textarea[required]');
//   inputs.forEach(input => {
//     if (!input.value.trim()) {
//       valid = false;
//       input.classList.add('error');
//     } else {
//       input.classList.remove('error');
//     }
//   });

//   // Custom validation for radio button groups
//   const radioGroups = form.querySelectorAll('.custom-radio');
//   radioGroups.forEach(group => {
//     const radios = group.querySelectorAll('input[type="radio"]');
//     const isSelected = Array.from(radios).some(radio => radio.checked);

//     if (!isSelected) {
//       valid = false;
//       group.classList.add('error'); // You can style this class to highlight the group
//     } else {
//       group.classList.remove('error');
//     }
//   });

//   return valid;
// }

// Initialize EmailJS

function validateForm(form) {
  let valid = true;

  // Validate required input, select, and textarea elements
  const inputs = form.querySelectorAll('input[required], select[required], textarea[required]');
  inputs.forEach(input => {
    // Trim leading/trailing spaces
    const value = input.value.trim();

    // Check if the field is empty
    if (!value) {
      valid = false;
      input.classList.add('error');
    } else {
      // If it's the email field, validate the email format
      if (input.type === 'text' && input.name === 'contact_email') {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/; // Simple regex pattern
        if (!emailRegex.test(value)) {
          valid = false;
          input.classList.add('error');
        } else {
          input.classList.remove('error');
        }
      } else {
        // Remove error if it's not the email field or if it's valid
        input.classList.remove('error');
      }
    }
  });

  // Custom validation for radio button groups
  const radioGroups = form.querySelectorAll('.custom-radio');
  radioGroups.forEach(group => {
    const radios = group.querySelectorAll('input[type="radio"]');
    const isSelected = Array.from(radios).some(radio => radio.checked);

    if (!isSelected) {
      valid = false;
      group.classList.add('error');
    } else {
      group.classList.remove('error');
    }
  });

  return valid;
}

function logFormData() {
  const formData1 = new FormData(document.getElementById('form-part-01'));
  const formData2 = new FormData(document.getElementById('form-part-02'));
  const formData3 = new FormData(document.getElementById('form-part-03'));

  const combinedData = {
    ...Object.fromEntries(formData1),
    ...Object.fromEntries(formData2),
    ...Object.fromEntries(formData3),
    date: new Date().toISOString()
  };

  // Optional: handle the "youarea" field logic
  if (!combinedData.contact_firsttime || combinedData.contact_firsttime === 'no') {
    combinedData.youarea = '';
  }

  // Optional: handle file upload (safely omit or base64 encode if you want)
  const fileInput = document.querySelector('input[type="file"]');
  const file = fileInput?.files[0];

  if (file) {
    const reader = new FileReader();
    reader.onload = function (e) {
      combinedData.file_name = file.name;
      combinedData.file_content = e.target.result;

      // Submit after encoding file
      sendFormDataToServer(combinedData);
    };
    reader.readAsDataURL(file);
  } else {
    // Submit directly without file
    sendFormDataToServer(combinedData);
  }
}

function sendFormDataToServer(data) {
  fetch('https://mariastudio-backend.onrender.com/submit-booking', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data)
  })
    .then(res => {
      if (!res.ok) throw new Error("Failed to submit booking");
      return res.json();
    })
    .then(response => {
      console.log('Booking submitted successfully:', response);
      alert('Thank you! Your booking has been submitted.');
    })
    .catch(err => {
      console.error('Error submitting booking:', err);
      alert('There was a problem submitting the form. Please try again.');
    });
}

function enableSwiping() {
  // Grab all the “main-book” elements
  const mainBookElements = document.querySelectorAll('[id^="main-book-"]');
  
  mainBookElements.forEach((element) => {
    // Each element ID is like “main-book-01”, “main-book-02”, etc.
    // We'll parse out the step number (e.g., 1 or 2 or 3).
    const partNumber = parseInt(element.id.split('-')[2], 10);
    
    let startX = 0;
    let startY = 0;
    
    element.addEventListener('touchstart', (e) => {
      // Record initial touch positions
      startX = e.touches[0].clientX;
      startY = e.touches[0].clientY;
    });

    element.addEventListener('touchend', (e) => {
      // Compare end positions to start
      const endX = e.changedTouches[0].clientX;
      const endY = e.changedTouches[0].clientY;
      const deltaX = endX - startX;
      const deltaY = endY - startY;

      // We only want to detect mostly horizontal swipes => ignore large vertical movement
      if (Math.abs(deltaY) > 50) {
        return; // Probably a vertical scroll, so ignore
      }

      // If user swiped left more than 50px => go to next part
      if (deltaX < -50) {
        // For example, swiping left on part 1 => show part 2
        showNextPart(partNumber);
      }
      // If user swiped right more than 50px => go to previous part
      else if (deltaX > 50) {
        showPreviousPart(partNumber);
      }
    });
  });
}

// Reinitialize when the modal is opened
document.addEventListener('modalOpened', initializeBookingForm);


