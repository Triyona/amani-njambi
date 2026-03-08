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
    const APPS_SCRIPT_URL = "https://script.google.com/macros/s/AKfycbzZai68weYynW2Qk-uxGggZZT7S-gBYFCoR5RwGTMODE-HSt5-Yllu5hH2DpX4IACexQA/exec";
    let currentStep = 0;
    let responseSelected = false;

    async function fetchGuests() {
        const response = await fetch(SHEET_URL + `&t=${Date.now()}`);
        const csv = await response.text();

        const rows = csv.trim().split("\n").slice(1); // skip header row
        return rows.map(row => {
            const cols = row.split(",");
            const first = cols[0];
            const middle = cols[1];
            const last = cols[2];
            const response = cols[5];

            console.log("Response value:", response);

            return {
                first: first?.trim().toLowerCase(),
                middle: middle?.trim().toLowerCase(),
                last: last?.trim().toLowerCase(),
                response: response?.replace(/\r/g, "").trim().toLowerCase()
            };
        });
    }

    async function updateGuestResponse(first, last, response) {
        try {
            await fetch(APPS_SCRIPT_URL, {
                method: "POST",
                body: JSON.stringify({ first, last, response })
            });
        } catch (err) {
            console.error("Could not update response:", err);
        }
    }

    async function updatePlusOne(first, last, plusOne) {
        try {
            await fetch(APPS_SCRIPT_URL, {
                method: "POST",
                body: JSON.stringify({ first, last, plusOne })
            });
        } catch (err) {
            console.error("Could not update plus one:", err);
        }
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

    function updateButtons() {
        if (currentStep <= 0) {
            findButton.style.display = "block";
            findButton.tabIndex = 0;
        } else {
            findButton.style.display = "none";
            findButton.tabIndex = -1; // 👈
        }
        if (currentStep === 1) {
            continueButton.style.display = "block";
            continueButton.tabIndex = 0;
        } else {
            continueButton.style.display = "none";
            continueButton.tabIndex = -1; // 👈
        }
        if (currentStep === 2) {
            submitButton.style.display = "block";
            submitButton.tabIndex = 0;
        } else {
            submitButton.style.display = "none";
            submitButton.tabIndex = -1; // 👈
        }
    }

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
        }, 5000);
    }

    function clearError() {
        const errorEl = document.querySelector(".validation-error");
        if (errorEl) errorEl.remove();
    }

    document.querySelector(".form-wizard").addEventListener("keydown", (e) => {
        if (e.key === "Tab") {
            e.preventDefault(); // 👈 prevent all default tab behavior

            const currentStepEl = steps[currentStep];
            const stepFocusable = Array.from(currentStepEl.querySelectorAll(
                'input, select, textarea'
            )).filter(el => !el.disabled);

            // Get the visible control button
            const visibleButton = [findButton, continueButton, submitButton]
                .find(btn => btn.style.display === "block");

            // Combine step inputs + visible button
            const focusable = visibleButton 
                ? [...stepFocusable, visibleButton] 
                : stepFocusable;

            if (focusable.length === 0) return;

            const currentIndex = focusable.indexOf(document.activeElement);

            if (e.shiftKey) {
                // Tab backwards
                const prevIndex = currentIndex <= 0 ? focusable.length - 1 : currentIndex - 1;
                focusable[prevIndex].focus();
            } else {
                // Tab forwards
                const nextIndex = currentIndex >= focusable.length - 1 ? 0 : currentIndex + 1;
                focusable[nextIndex].focus();
            }
        }
    });


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
                showError("Oops! We are having trouble finding your invite. Please try another spelling of your name or contact the couple");
                findButton.textContent = "FIND YOUR INVITATION";
                findButton.disabled = false;
                return;
            }

            // Update the guest name in step 2 using the name from the sheet
            const guestNameEl = document.querySelector(".guest-name");
            guestNameEl.textContent = `${found.first} ${found.middle || ""} ${found.last}`.trim();

            // Pre-select accept/decline based on existing response
            if (found.response === "yes") {
                addRemoveActive(declineBtn, acceptBtn);
                responseSelected = true;
                document.getElementById("plus-one").disabled = false;
            } else if (found.response === "no") {
                addRemoveActive(acceptBtn, declineBtn);
                responseSelected = true;
                document.getElementById("plus-one").disabled = true;
                document.getElementById("plus-one").checked = false;
            } else {
                acceptBtn.classList.remove("active");
                declineBtn.classList.remove("active");
                document.getElementById("plus-one").disabled = true; // disabled until they choose
                document.getElementById("plus-one").checked = false;
                responseSelected = false;
            }

            clearError();
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

        // Update plus one in sheet
        const plusOne = document.getElementById("plus-one").checked;
        updatePlusOne(
            document.getElementById("first").value.trim().toLowerCase(),
            document.getElementById("last").value.trim().toLowerCase(),
            plusOne ? "1" : ""
        );

        if (currentStep < 3) {
            currentStep++;
            updateProgress();
        }
    });

    //accept & decline

    acceptBtn.onclick = () => {
        addRemoveActive(declineBtn, acceptBtn);
        responseSelected = true;

        const plusOne = document.getElementById("plus-one");
        plusOne.disabled = false; // 👈 CSS handles the visual

        updateGuestResponse(
            document.getElementById("first").value.trim().toLowerCase(),
            document.getElementById("last").value.trim().toLowerCase(),
            "yes"
        );
    };

    declineBtn.onclick = () => {
        addRemoveActive(acceptBtn, declineBtn);
        responseSelected = true;

        const plusOne = document.getElementById("plus-one");
        plusOne.disabled = true;  // 👈 CSS handles the visual
        plusOne.checked = false;

        updateGuestResponse(
            document.getElementById("first").value.trim().toLowerCase(),
            document.getElementById("last").value.trim().toLowerCase(),
            "no"
        );
    };

    updateProgress();
});