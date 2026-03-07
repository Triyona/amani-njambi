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

    async function fetchGuests() {
        const response = await fetch(SHEET_URL);
        const csv = await response.text();

        const rows = csv.trim().split("\n").slice(1); // skip header row
        return rows.map(row => {
            const [first, middle, last] = row.split(",");
            return {
                first: first?.trim().toLowerCase(),
                middle: middle?.trim().toLowerCase(),
                last: last?.trim().toLowerCase()
            };
        });
    }

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

    findButton.addEventListener("click", async (e) => {
        e.preventDefault();

        const first = document.getElementById("first").value.trim().toLowerCase();
        const last = document.getElementById("last").value.trim().toLowerCase();

        if (!first || !last) {
            showError("Please enter your first/middle and last name.");
            return;
        }

        findButton.textContent = "Searching...";
        findButton.disabled = true;

        try {
            const guests = await fetchGuests();

            const found = guests.find(g =>
                (g.first === first || g.middle === first) &&
                g.last === last
            );

            if (!found) {
                showError("We couldn't find your name on the guest list. Please check your spelling.");
                findButton.textContent = "FIND YOUR INVITATION";
                findButton.disabled = false;
                return;
            }

            // Update the guest name in step 2 using the name from the sheet
            const guestNameEl = document.querySelector(".guest-name");
            guestNameEl.textContent = `${found.first} ${found.middle || ""} ${found.last}`.trim();

            currentStep++;
            updateProgress();

        } catch (err) {
            showError("Could not load guest list. Please try again.");
            findButton.textContent = "FIND YOUR INVITATION";
            findButton.disabled = false;
            console.error(err);
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