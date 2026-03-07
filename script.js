document.addEventListener('DOMContentLoaded',() => {

    const progress = document.querySelector('.progress');
    const stepsContainer = document.querySelector('.steps-container');
    const steps = document.querySelectorAll('.step');
    const stepIndicators = document.querySelectorAll('.progress-container li');
    const findButton = document.querySelector('.find-btn');
    const continueButton = document.querySelector('.continue-btn');
    const submitButton = document.querySelector('.submit-btn');

    const acceptBtn = document.getElementById("ACCEPT");
    const declineBtn = document.getElementById("DECLINE");

    document.documentElement.style.setProperty('--steps', stepIndicators.length);

    const SHEET_URL = "https://docs.google.com/spreadsheets/d/e/2PACX-1vTINXx35PLxURTZ2raLSwJQVCBh5pzE4kAqjl8RGQey0slb9D1ck7TFrT7qJn0uuTgRN3ajjdl6oxh3/pub?output=csv";
    let currentStep = 0;
    let responseSelected = false;

    const updateProgress = () => {
        let width = currentStep / (stepIndicators.length - 1);
        progress.style.transform = `scaleX(${width})`;

        stepsContainer.style.height = steps[currentStep].offsetHeight + "px";

        stepIndicators.forEach((indicator, index) => {
            indicator.classList.toggle("current", currentStep === index);
            indicator.classList.toggle("done", currentStep > index);
        });
        
        steps.forEach((step, index) => {
            step.style.transform = `translateX(-${currentStep * 100}%)`;
            step.classList.toggle("current", currentStep === index);
        });

        updateButtons();
    };

    function updateButtons () {
        if (currentStep <= 0) {
            findButton.style.display = 'block'; // Show the button
        } else {
            findButton.style.display = 'none'; // Hide the button
        }
        if (currentStep === 1) {
            continueButton.style.display = 'block'; // Show the button
        } else {
            continueButton.style.display = 'none'; // Hide the button
        }
        if (currentStep === 2) {
            submitButton.style.display = 'block'; // Show the button
        } else {
            submitButton.style.display = 'none'; // Hide the button
        }
    };

    function addRemoveActive(remove, add) {
        remove.classList.remove("active");
        add.classList.add("active");
    }

    function showError(message) {
        let errorEl = document.querySelector(".validation-error");
        if (!errorEl) {
            errorEl = document.createElement("p");
            errorEl.classList.add("validation-error");
            document.querySelector(".controls").insertAdjacentElement("beforebegin", errorEl);
        }
        errorEl.textContent = message;

        // Auto-clear after 3 seconds
        clearTimeout(errorEl._timer);
        errorEl._timer = setTimeout(() => {
            errorEl.remove();
        }, 3000);
    }


    //*event listeners

    findButton.addEventListener("click", (e) => {
        e.preventDefault(); //prevent form submission

        if (currentStep < 2){
            currentStep++;
            updateProgress();
        }
    });

    continueButton.addEventListener("click", (e) => {
        e.preventDefault();

        // Validate step 2: accept or decline must be selected
        if (!responseSelected) {
            showError("Please select Accept or Decline before continuing.");
            return;
        }

        if (currentStep < 3) {
            currentStep++;
            updateProgress();
        }
    });

    //accept & decline

    acceptBtn.onclick = () => {
        addRemoveActive(declineBtn, acceptBtn);
        responseSelected = true;
    };

    declineBtn.onclick = () => {
        addRemoveActive(acceptBtn, declineBtn);
        responseSelected = true;
    };

    updateProgress();
});