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
    const switchContainer = document.querySelector(".switch-container");

    document.documentElement.style.setProperty('--steps', stepIndicators.length);

    let currentStep = 0;

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


    //accept & decline

    acceptBtn.onclick = () => {
        addRemoveActive(declineBtn, acceptBtn);
    };

    declineBtn.onclick = () => {
        addRemoveActive(acceptBtn, declineBtn);
    };

    function addRemoveActive(remove, add) {
        remove.classList.remove("active");
        add.classList.add("active");
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
        e.preventDefault(); //prevent form submission

        if (currentStep < 3){
            currentStep++;
            updateProgress();
        }
    });

    updateProgress();
});