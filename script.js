document.addEventListener('DOMContentLoaded', () => {

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

    const APPS_SCRIPT_URL = "https://script.google.com/macros/s/AKfycbyuGothnuPsQDs29K_JCmBRs4HIYHtYPBdesdnatH_4LqmKM6QvEKJwfdD6ao815yAl5Q/exec";

    let currentStep = 0;
    let responseSelected = false;
    let currentGuest = null;
    let allGuests = [];

    // ── FETCH ─────────────────────────────────────────────────────
    async function fetchGuests() {
        const response = await fetch(APPS_SCRIPT_URL + `?t=${Date.now()}`);
        const rows = await response.json();
        return rows.map(row => ({
            first: row["first"]?.toString().trim().toLowerCase(),
            middle: row["middle"]?.toString().trim().toLowerCase(),
            last: row["last"]?.toString().trim().toLowerCase(),
            familyGroup: row["family-group"]?.toString().trim().toLowerCase(),
            plusOne: row["plus 1"]?.toString().trim(),
            response: row["response"]?.toString().trim().toLowerCase(),
            email: row["email"]?.toString().trim(),
            birthYear: row["birth-year"]?.toString().trim(),
            addedBy: row["added-by"]?.toString().trim()
        }));
    }

    async function postToSheet(payload) {
        try {
            await fetch(APPS_SCRIPT_URL, {
                method: "POST",
                mode: "no-cors",
                headers: { "Content-Type": "text/plain" },
                body: JSON.stringify(payload)
            });
        } catch (err) {
            console.error("POST error:", err);
        }
    }

    // ── PROGRESS ──────────────────────────────────────────────────
    const updateProgress = () => {
        let width = currentStep / (stepIndicators.length - 1);
        progress.style.transform = `scaleX(${width})`;
        stepsContainer.style.height = steps[currentStep].scrollHeight + "px";
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
        findButton.style.display = currentStep === 0 ? "block" : "none";
        findButton.tabIndex = currentStep === 0 ? 0 : -1;
        continueButton.style.display = currentStep === 1 ? "block" : "none";
        continueButton.tabIndex = currentStep === 1 ? 0 : -1;
        submitButton.style.display = currentStep === 2 ? "block" : "none";
        submitButton.tabIndex = currentStep === 2 ? 0 : -1;
    }

    // ── HELPERS ───────────────────────────────────────────────────
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
        clearTimeout(errorEl._timer);
        errorEl._timer = setTimeout(() => errorEl.remove(), 5000);
    }

    function clearError() {
        const errorEl = document.querySelector(".validation-error");
        if (errorEl) errorEl.remove();
    }

    // ── BIRTH YEAR PROMPT (step 1) ────────────────────────────────
    function showBirthYearPrompt() {
        const existing = document.querySelector(".birth-year-prompt");
        if (existing) return;

        const wrapper = document.createElement("div");
        wrapper.classList.add("birth-year-prompt");
        wrapper.innerHTML = `
            <p style="color: rgb(245,245,220); margin: 10px 0 4px; font-size: 0.95rem;">
                Please enter your birth year to continue.
            </p>
            <input type="number" class="text-input birth-year-input" placeholder="Birth Year (e.g. 1990)"
                min="1900" max="2025" style="width:14rem;">
        `;
        const formControl = document.querySelector(".form-control");
        formControl.insertAdjacentElement("afterend", wrapper);
        stepsContainer.style.height = steps[currentStep].scrollHeight + "px";
    }

    // ── INLINE RSVP ROW ───────────────────────────────────────────
    function createInlineRSVPRow({ id, fullName, existingResponse, locked, addedByPrimary }) {
        const wrapper = document.createElement("div");
        wrapper.classList.add("inline-rsvp-row");
        wrapper.dataset.id = id;

        const nameEl = document.createElement("span");
        nameEl.classList.add("inline-name");
        nameEl.textContent = fullName;

        const switchEl = document.createElement("div");
        switchEl.classList.add("inline-switch");

        const acceptEl = document.createElement("button");
        acceptEl.type = "button";
        acceptEl.textContent = "ACCEPT";
        acceptEl.classList.add("inline-accept");

        const declineEl = document.createElement("button");
        declineEl.type = "button";
        declineEl.textContent = "DECLINE";
        declineEl.classList.add("inline-decline");

        switchEl.appendChild(acceptEl);
        switchEl.appendChild(declineEl);

        if (locked) {
            wrapper.dataset.locked = "true";
            acceptEl.disabled = true;
            declineEl.disabled = true;
            if (existingResponse === "yes") acceptEl.classList.add("active");
            if (existingResponse === "no") declineEl.classList.add("active");
            const lockedNote = document.createElement("span");
            lockedNote.classList.add("locked-note");
            lockedNote.textContent = "Already responded";
            wrapper.appendChild(nameEl);
            wrapper.appendChild(switchEl);
            wrapper.appendChild(lockedNote);
        } else {
            if (existingResponse === "yes") acceptEl.classList.add("active");
            if (existingResponse === "no") declineEl.classList.add("active");

            acceptEl.addEventListener("click", () => {
                acceptEl.classList.add("active");
                declineEl.classList.remove("active");
                wrapper.dataset.response = "yes";
            });
            declineEl.addEventListener("click", () => {
                declineEl.classList.add("active");
                acceptEl.classList.remove("active");
                wrapper.dataset.response = "no";
            });

            wrapper.dataset.response = existingResponse || "";

            if (addedByPrimary) {
                const removeBtn = document.createElement("button");
                removeBtn.type = "button";
                removeBtn.textContent = "✕";
                removeBtn.classList.add("remove-member-btn");
                removeBtn.addEventListener("click", () => {
                    wrapper.remove();
                    stepsContainer.style.height = steps[currentStep].scrollHeight + "px";
                });
                wrapper.appendChild(nameEl);
                wrapper.appendChild(switchEl);
                wrapper.appendChild(removeBtn);
            } else {
                wrapper.appendChild(nameEl);
                wrapper.appendChild(switchEl);
            }
        }

        return wrapper;
    }

    // ── PLUS ONE SECTION ──────────────────────────────────────────
    function renderPlusOneSection(guest) {
        const container = document.querySelector(".check-container");
        container.innerHTML = "";

        const existingNotice = document.querySelector(".plusone-notice");
        if (existingNotice) existingNotice.remove();

        if (guest.plusOne === "0") {
            container.style.display = "none";
            if (guest.addedBy) {
                const notice = document.createElement("p");
                notice.classList.add("plusone-notice");
                notice.style.cssText = "color: rgb(187,134,56); font-size: 0.95rem; margin-top: 10px; font-style: italic;";
                const addedByName = guest.addedBy.split(" ")
                    .map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(" ");
                notice.textContent = `You have been added as a plus one by ${addedByName}.`;
                container.insertAdjacentElement("afterend", notice);
            }
            return;
        }

        container.style.display = "block";

        // Checkbox
        const checkWrapper = document.createElement("p");
        const checkbox = document.createElement("input");
        checkbox.type = "checkbox";
        checkbox.id = "plus-one";
        checkbox.name = "plus-one";
        const label = document.createElement("label");
        label.htmlFor = "plus-one";
        label.textContent = "Plus one";
        checkWrapper.appendChild(checkbox);
        checkWrapper.appendChild(label);
        container.appendChild(checkWrapper);

        // Plus one area
        const plusOneArea = document.createElement("div");
        plusOneArea.classList.add("plus-one-area");
        plusOneArea.style.display = "none";
        container.appendChild(plusOneArea);

        // Name + year fields
        const plusOneFields = document.createElement("div");
        plusOneFields.classList.add("plus-one-fields");
        plusOneFields.innerHTML = `
            <input type="text" class="text-input plus-one-first" placeholder="Plus One First Name" style="width:13rem; margin: 6px 4px;">
            <input type="text" class="text-input plus-one-last" placeholder="Plus One Last Name" style="width:13rem; margin: 6px 4px;">
            <input type="number" class="text-input plus-one-year" placeholder="Plus One Birth Year" style="width:13rem; margin: 6px 4px;" min="1900" max="2025">
        `;

        const confirmPlusOneBtn = document.createElement("button");
        confirmPlusOneBtn.type = "button";
        confirmPlusOneBtn.textContent = "Confirm Plus One";
        confirmPlusOneBtn.classList.add("confirm-add-btn");

        const confirmedRow = document.createElement("div");
        confirmedRow.classList.add("plus-one-confirmed");
        confirmedRow.style.display = "none";

        plusOneArea.appendChild(plusOneFields);
        plusOneArea.appendChild(confirmPlusOneBtn);
        plusOneArea.appendChild(confirmedRow);

        // Pre-fill if previously saved
        const previousPlusOne = allGuests.find(g =>
            g.addedBy === `${guest.first} ${guest.last}` && g.plusOne === "0"
        );

        if (guest.plusOne === "1" && previousPlusOne) {
            checkbox.checked = true;
            plusOneArea.style.display = "block";
            showConfirmedPlusOne(
                confirmedRow, plusOneFields, confirmPlusOneBtn,
                previousPlusOne.first, previousPlusOne.last,
                previousPlusOne.birthYear || "",
                previousPlusOne.response || ""
            );
        }

        // Checkbox change
        checkbox.addEventListener("change", () => {
            if (checkbox.checked) {
                plusOneArea.style.display = "block";
                if (confirmedRow.dataset.confirmed === "true") {
                    plusOneFields.style.display = "none";
                    confirmPlusOneBtn.style.display = "none";
                    confirmedRow.style.display = "flex";
                } else {
                    plusOneFields.style.display = "flex";
                    confirmPlusOneBtn.style.display = "inline-block";
                    confirmedRow.style.display = "none";
                }
            } else {
                plusOneArea.style.display = "none";
            }
            stepsContainer.style.height = steps[currentStep].scrollHeight + "px";
        });

        // Confirm button
        confirmPlusOneBtn.addEventListener("click", () => {
            const firstVal = plusOneFields.querySelector(".plus-one-first").value.trim();
            const lastVal = plusOneFields.querySelector(".plus-one-last").value.trim();
            const yearVal = plusOneFields.querySelector(".plus-one-year").value.trim();

            if (!firstVal || !lastVal) {
                showError("Please enter the plus one's first and last name.");
                return;
            }
            if (!yearVal || yearVal.length < 4) {
                showError("Please enter the plus one's birth year.");
                return;
            }

            showConfirmedPlusOne(
                confirmedRow, plusOneFields, confirmPlusOneBtn,
                firstVal.toLowerCase(), lastVal.toLowerCase(),
                yearVal, ""
            );

            stepsContainer.style.height = steps[currentStep].scrollHeight + "px";
        });
    }

    // ── CONFIRMED PLUS ONE ROW ────────────────────────────────────
    function showConfirmedPlusOne(confirmedRow, plusOneFields, confirmPlusOneBtn, first, last, birthYear, existingResponse) {
        confirmedRow.style.cssText = "";
        confirmedRow.classList.add("inline-rsvp-row");
        confirmedRow.dataset.confirmed = "true";
        confirmedRow.dataset.first = first;
        confirmedRow.dataset.last = last;
        confirmedRow.dataset.birthYear = birthYear || "";

        const fullName = `${first.charAt(0).toUpperCase() + first.slice(1)} ${last.charAt(0).toUpperCase() + last.slice(1)}`;

        const nameEl = document.createElement("span");
        nameEl.classList.add("inline-name");
        nameEl.textContent = fullName;

        const switchEl = document.createElement("div");
        switchEl.classList.add("inline-switch");

        const acceptEl = document.createElement("button");
        acceptEl.type = "button";
        acceptEl.textContent = "ACCEPT";
        acceptEl.classList.add("inline-accept");

        const declineEl = document.createElement("button");
        declineEl.type = "button";
        declineEl.textContent = "DECLINE";
        declineEl.classList.add("inline-decline");

        const initialResponse = existingResponse || "yes";
        if (initialResponse === "yes") acceptEl.classList.add("active");
        if (initialResponse === "no") declineEl.classList.add("active");
        confirmedRow.dataset.response = initialResponse;

        acceptEl.addEventListener("click", () => {
            acceptEl.classList.add("active");
            declineEl.classList.remove("active");
            confirmedRow.dataset.response = "yes";
        });
        declineEl.addEventListener("click", () => {
            declineEl.classList.add("active");
            acceptEl.classList.remove("active");
            confirmedRow.dataset.response = "no";
        });

        switchEl.appendChild(acceptEl);
        switchEl.appendChild(declineEl);

        const editBtn = document.createElement("button");
        editBtn.type = "button";
        editBtn.innerHTML = "✏️";
        editBtn.classList.add("remove-member-btn");
        editBtn.title = "Edit plus one";
        editBtn.addEventListener("click", () => {
            plusOneFields.querySelector(".plus-one-first").value =
                first.charAt(0).toUpperCase() + first.slice(1);
            plusOneFields.querySelector(".plus-one-last").value =
                last.charAt(0).toUpperCase() + last.slice(1);
            if (plusOneFields.querySelector(".plus-one-year")) {
                plusOneFields.querySelector(".plus-one-year").value = birthYear || "";
            }
            plusOneFields.style.display = "flex";
            confirmPlusOneBtn.style.display = "inline-block";
            confirmedRow.style.display = "none";
            confirmedRow.dataset.confirmed = "false";
            stepsContainer.style.height = steps[currentStep].scrollHeight + "px";
        });

        confirmedRow.appendChild(nameEl);
        confirmedRow.appendChild(switchEl);
        confirmedRow.appendChild(editBtn);

        plusOneFields.style.display = "none";
        confirmPlusOneBtn.style.display = "none";
    }

    // ── FAMILY SECTION ────────────────────────────────────────────
    function renderFamilySection(guest, allGuests) {
        const existing = document.querySelector(".family-list");
        if (existing) existing.remove();

        if (guest.plusOne === "0") return;

        const familyList = document.createElement("div");
        familyList.classList.add("family-list");

        const heading = document.createElement("p");
        heading.classList.add("family-heading");
        heading.textContent = "RSVP for your family";
        familyList.appendChild(heading);

        if (guest.familyGroup) {
            const familyMembers = allGuests.filter(g =>
                g.familyGroup &&
                g.familyGroup === guest.familyGroup &&
                !(g.first === guest.first && g.last === guest.last)
            );
            familyMembers.forEach(member => {
                const hasResponded = member.response === "yes" || member.response === "no";
                const respondedIndependently = hasResponded && !member.addedBy;
                const fullName = `${member.first} ${member.middle || ""} ${member.last}`.trim();
                const row = createInlineRSVPRow({
                    id: `family-${member.first}-${member.last}`,
                    fullName,
                    existingResponse: member.response || "",
                    locked: respondedIndependently,
                    addedByPrimary: false
                });
                // Store data so they're included in linkFamilyGroup
                row.dataset.first = member.first;
                row.dataset.last = member.last;
                row.dataset.birthYear = member.birthYear || "";
                row.dataset.isNew = "false";
                familyList.appendChild(row);
            });
        }

        // Add family member fields
        const addSection = document.createElement("div");
        addSection.classList.add("add-family-section");

        const addFields = document.createElement("div");
        addFields.classList.add("add-family-fields");
        addFields.style.display = "none";
        addFields.innerHTML = `
            <input type="text" class="text-input fam-first" placeholder="First Name" style="width:12rem; margin: 4px;">
            <input type="text" class="text-input fam-middle" placeholder="Middle Name (optional)" style="width:12rem; margin: 4px;">
            <input type="text" class="text-input fam-last" placeholder="Last Name" style="width:12rem; margin: 4px;">
            <input type="number" class="text-input fam-year" placeholder="Birth Year (required)" style="width:12rem; margin: 4px;" min="1900" max="2025">
        `;

        const addBtn = document.createElement("button");
        addBtn.type = "button";
        addBtn.textContent = "+ Add Family Member";
        addBtn.classList.add("add-family-btn");

        const confirmAddBtn = document.createElement("button");
        confirmAddBtn.type = "button";
        confirmAddBtn.textContent = "Confirm";
        confirmAddBtn.classList.add("confirm-add-btn");
        confirmAddBtn.style.display = "none";

        addBtn.addEventListener("click", () => {
            addFields.style.display = "block";
            confirmAddBtn.style.display = "inline-block";
            addBtn.style.display = "none";
            stepsContainer.style.height = steps[currentStep].scrollHeight + "px";
        });

        confirmAddBtn.addEventListener("click", () => {
            const firstVal = addFields.querySelector(".fam-first").value.trim();
            const middleVal = addFields.querySelector(".fam-middle").value.trim();
            const lastVal = addFields.querySelector(".fam-last").value.trim();
            const first = firstVal.toLowerCase();
            const middle = middleVal.toLowerCase();
            const last = lastVal.toLowerCase();

            if (!first || !last) {
                showError("Please enter at least a first and last name.");
                return;
            }

            const yearField = addFields.querySelector(".fam-year");
            const birthYearVal = yearField ? yearField.value.trim() : "";
            if (!birthYearVal || birthYearVal.length < 4) {
                showError("Please enter the family member's birth year.");
                return;
            }

            // Check if already added in this session
            const alreadyAdded = document.querySelectorAll(".family-list .inline-rsvp-row");
            const isDuplicate = Array.from(alreadyAdded).some(r =>
                r.dataset.first === first && r.dataset.last === last
            );
            if (isDuplicate && !birthYearVal) {
                showError("You've already added someone with this name. Please enter their birth year to differentiate.");
                return;
            }

            // Check if in system
            const existingMatches = allGuests.filter(g => g.first === first && g.last === last);
            let existing = null;
            let birthYear = birthYearVal;

            if (existingMatches.length === 1) {
                existing = existingMatches[0].birthYear === birthYearVal ? existingMatches[0] : null;
            } else if (existingMatches.length > 1) {
                existing = existingMatches.find(g => g.birthYear === birthYearVal);
            }

            const hasResponded = existing && (existing.response === "yes" || existing.response === "no");
            const respondedIndependently = hasResponded && !existing.addedBy;
            const fullName = `${firstVal}${middleVal ? " " + middleVal : ""} ${lastVal}`.trim();

            const row = createInlineRSVPRow({
                id: `family-new-${first}-${last}-${Date.now()}`,
                fullName,
                existingResponse: existing?.response || "",
                locked: respondedIndependently,
                addedByPrimary: true
            });

            row.dataset.first = first;
            row.dataset.middle = middle;
            row.dataset.last = last;
            row.dataset.birthYear = birthYear;
            row.dataset.isNew = existing ? "false" : "true";

            familyList.insertBefore(row, addSection);
            // Force layout recalc after insert
            requestAnimationFrame(() => {
                stepsContainer.style.height = steps[currentStep].scrollHeight + "px";
            });

            // Reset
            addFields.querySelectorAll("input").forEach(i => i.value = "");
            addFields.style.display = "none";
            confirmAddBtn.style.display = "none";
            addBtn.style.display = "inline-block";
        });

        addSection.appendChild(addFields);
        addSection.appendChild(addBtn);
        addSection.appendChild(confirmAddBtn);
        familyList.appendChild(addSection);

        const checkContainer = document.querySelector(".check-container");
        checkContainer.insertAdjacentElement("afterend", familyList);
    }

    // ── FIND BUTTON ───────────────────────────────────────────────
    findButton.addEventListener("click", async (e) => {
        e.preventDefault();

        const firstRaw = document.getElementById("first").value.trim();
        const lastRaw = document.getElementById("last").value.trim();
        const first = firstRaw.toLowerCase();
        const last = lastRaw.toLowerCase();

        if (!first || !last) {
            showError("Please enter your first/middle and last name.");
            return;
        }

        const existingYearInput = document.querySelector(".birth-year-input");
        const birthYear = existingYearInput ? existingYearInput.value.trim() : "";

        if (!existingYearInput) {
            showBirthYearPrompt();
            return;
        }

        if (!birthYear || birthYear.length < 4) {
            showError("Please enter your birth year to continue.");
            return;
        }

        findButton.textContent = "Searching...";
        findButton.disabled = true;

        try {
            const guests = await fetchGuests();
            allGuests = guests;

            let matches = guests.filter(g => {
                const fullFirst = `${g.first} ${g.middle}`.trim();
                return (
                    g.first === first ||
                    g.middle === first ||
                    fullFirst === first
                ) && g.last === last;
            });

            let found = null;

            if (matches.length === 0) {
                // Check for partial match — same first+last+year but no middle on file
                const parts = first.split(" ");
                if (parts.length >= 2) {
                    const firstOnly = parts[0];
                    const middleOnly = parts.slice(1).join(" ");
                    const partialMatch = guests.find(g =>
                        g.first === firstOnly &&
                        g.last === last &&
                        (!g.middle || g.middle === "") &&
                        g.birthYear === birthYear
                    );
                    if (partialMatch) {
                        await postToSheet({
                            action: "updateMiddleName",
                            first: firstOnly,
                            last,
                            middle: middleOnly,
                            birthYear
                        });
                        allGuests = await fetchGuests();
                        found = allGuests.find(g =>
                            g.first === firstOnly && g.last === last && g.birthYear === birthYear
                        );
                    }
                }

                if (!found) {
                    const parts = first.split(" ");
                    const firstOnly = parts[0];
                    const middleOnly = parts.length >= 2 ? parts.slice(1).join(" ") : "";
                    await postToSheet({
                        action: "createGuest",
                        first: firstOnly,
                        middle: middleOnly,
                        last,
                        birthYear
                    });
                    allGuests = await fetchGuests();
                    found = allGuests.find(g =>
                        g.first === firstOnly && g.last === last && g.birthYear === birthYear
                    );
                    if (!found) found = {
                        first: firstOnly, middle: middleOnly, last,
                        familyGroup: "", plusOne: "", response: "", email: "", birthYear
                    };
                }

            } else if (matches.length > 1) {
                found = matches.find(g => g.birthYear === birthYear);
                if (!found) {
                    // Different year — new guest
                    const parts = first.split(" ");
                    const firstOnly = parts[0];
                    const middleOnly = parts.length >= 2 ? parts.slice(1).join(" ") : "";
                    await postToSheet({
                        action: "createGuest",
                        first: firstOnly,
                        middle: middleOnly,
                        last,
                        birthYear
                    });
                    allGuests = await fetchGuests();
                    found = allGuests.find(g =>
                        g.first === firstOnly && g.last === last && g.birthYear === birthYear
                    );
                    if (!found) found = {
                        first: firstOnly, middle: middleOnly, last,
                        familyGroup: "", plusOne: "", response: "", email: "", birthYear
                    };
                }

            } else {
                found = matches[0];
                if (found.birthYear && found.birthYear !== birthYear) {
                    // Same name, different year — new guest
                    const parts = first.split(" ");
                    const firstOnly = parts[0];
                    const middleOnly = parts.length >= 2 ? parts.slice(1).join(" ") : "";
                    await postToSheet({
                        action: "createGuest",
                        first: firstOnly,
                        middle: middleOnly,
                        last,
                        birthYear
                    });
                    allGuests = await fetchGuests();
                    found = allGuests.find(g =>
                        g.first === firstOnly && g.last === last && g.birthYear === birthYear
                    );
                    if (!found) found = {
                        first: firstOnly, middle: middleOnly, last,
                        familyGroup: "", plusOne: "", response: "", email: "", birthYear
                    };
                } else if (!found.birthYear) {
                    await postToSheet({
                        action: "saveBirthYear",
                        first: found.first,
                        last: found.last,
                        birthYear
                    });
                }
            }

            currentGuest = found;

            document.querySelector(".guest-name").textContent =
                `${found.first} ${found.middle || ""} ${found.last}`.trim();

            if (found.response === "yes") {
                addRemoveActive(declineBtn, acceptBtn);
                responseSelected = true;
            } else if (found.response === "no") {
                addRemoveActive(acceptBtn, declineBtn);
                responseSelected = true;
            } else {
                acceptBtn.classList.remove("active");
                declineBtn.classList.remove("active");
                responseSelected = false;
            }

            renderPlusOneSection(found);
            renderFamilySection(found, allGuests);

            clearError();
            findButton.textContent = "FIND YOUR INVITATION";
            findButton.disabled = false;
            currentStep++;
            updateProgress();

        } catch (err) {
            showError("Could not load guest list. Please try again.");
            findButton.textContent = "FIND YOUR INVITATION";
            findButton.disabled = false;
            console.error(err);
        }
    });

    // ── CONTINUE BUTTON ───────────────────────────────────────────
    continueButton.addEventListener("click", async (e) => {
        e.preventDefault();

        if (!responseSelected) {
            showError("Please select Accept or Decline before continuing.");
            return;
        }

        // Declare once, reuse throughout
        const familyRows = document.querySelectorAll(".family-list .inline-rsvp-row");
        const confirmedRow = document.querySelector(".plus-one-confirmed");
        const plusOneCheckbox = document.getElementById("plus-one");

        // Validate family rows
        for (const row of familyRows) {
            const isLocked = row.dataset.locked === "true";
            const hasResponse = row.dataset.response === "yes" || row.dataset.response === "no";
            const isExisting = row.dataset.isNew === "false";

            // Skip locked rows and existing members who already have a response
            if (isLocked) continue;
            if (isExisting && hasResponse) continue;

            // Only require response for new additions or existing members with no prior response
            if (!hasResponse) {
                showError("Please select Accept or Decline for all family members.");
                continueButton.textContent = "CONTINUE";
                continueButton.disabled = false;
                return;
            }
        }

        // Validate plus one
        if (confirmedRow && confirmedRow.dataset.confirmed === "true" && !confirmedRow.dataset.response) {
            showError("Please select Accept or Decline for your plus one.");
            return;
        }

        continueButton.textContent = "Saving...";
        continueButton.disabled = true;

        // Family rows
        const membersForGroup = [{ first: currentGuest.first, last: currentGuest.last }];

        for (const row of familyRows) {
            const first = row.dataset.first;
            const last = row.dataset.last;
            const middle = row.dataset.middle || "";
            const birthYear = row.dataset.birthYear || "";
            const isNew = row.dataset.isNew === "true";
            const response = row.dataset.response || "";

            if (!first || !last) continue;

            if (isNew) {
                await postToSheet({
                    action: "createGuest",
                    first, middle, last, birthYear,
                    addedBy: `${currentGuest.first} ${currentGuest.last}`
                });
            }

            if (response) {
                await postToSheet({ first, last, birthYear, response });
            }

            membersForGroup.push({ first, last });
        }

        // Plus one
        if (plusOneCheckbox && !plusOneCheckbox.checked) {
            const previousPlusOne = allGuests.find(g =>
                g.addedBy === `${currentGuest.first} ${currentGuest.last}` && g.plusOne === "0"
            );
            if (previousPlusOne) {
                await postToSheet({
                    action: "removePlusOne",
                    first: previousPlusOne.first,
                    last: previousPlusOne.last,
                    birthYear: previousPlusOne.birthYear || ""
                });
            }
            await postToSheet({
                first: currentGuest.first,
                last: currentGuest.last,
                birthYear: currentGuest.birthYear || "",
                plusOne: ""
            });

        } else if (plusOneCheckbox && plusOneCheckbox.checked && confirmedRow && confirmedRow.dataset.confirmed === "true") {
            const poFirst = confirmedRow.dataset.first;
            const poLast = confirmedRow.dataset.last;
            const poBirthYear = confirmedRow.dataset.birthYear || "";
            const poResponse = confirmedRow.dataset.response || "yes";
            const poIsNew = !allGuests.find(g => g.first === poFirst && g.last === poLast);

            if (poFirst && poLast) {
                if (poIsNew) {
                    await postToSheet({
                        action: "createGuest",
                        first: poFirst,
                        last: poLast,
                        birthYear: poBirthYear,
                        plusOne: "0",
                        addedBy: `${currentGuest.first} ${currentGuest.last}`
                    });
                } else {
                    await postToSheet({
                        first: poFirst,
                        last: poLast,
                        birthYear: poBirthYear,
                        plusOne: "0"
                    });
                }
                if (poResponse) {
                    await postToSheet({ first: poFirst, last: poLast, birthYear: poBirthYear, response: poResponse });
                }
                await postToSheet({
                    first: currentGuest.first,
                    last: currentGuest.last,
                    birthYear: currentGuest.birthYear || "",
                    plusOne: "1"
                });
            }
        }

        // Link family group
        if (membersForGroup.length > 1) {
            await postToSheet({ action: "linkFamilyGroup", members: membersForGroup });
        }

        // Pre-fill email
        if (currentGuest?.email) {
            document.querySelector('input[name="email"]').value = currentGuest.email;
        }

        continueButton.textContent = "CONTINUE";
        continueButton.disabled = false;
        currentStep++;
        updateProgress();

        setTimeout(() => {
            stepsContainer.style.height = steps[currentStep].scrollHeight + "px";
        }, 50);
    });

    // ── SUBMIT BUTTON ─────────────────────────────────────────────
    submitButton.addEventListener("click", async (e) => {
        e.preventDefault();

        const email = document.querySelector('input[name="email"]').value.trim();
        const first = currentGuest.first;
        const last = currentGuest.last;
        const response = acceptBtn.classList.contains("active") ? "yes" : "no";
        const successMessage = document.querySelector(".success-message");
        const successEmail = document.querySelector(".success-email");

        submitButton.textContent = "Submitting...";
        submitButton.disabled = true;

        try {
            await fetch(APPS_SCRIPT_URL, {
                method: "POST",
                mode: "no-cors",
                headers: { "Content-Type": "text/plain" },
                body: JSON.stringify({ first, last, email, response, sendConfirmation: true })
            });

            if (email) {
                successMessage.textContent = "Your RSVP has been confirmed. A confirmation has been sent to:";
                successEmail.textContent = email;
            } else {
                successMessage.textContent = response === "yes"
                    ? "Your RSVP has been confirmed. We look forward to celebrating with you!"
                    : "Thank you for letting us know. You will be missed!";
                if (successEmail) successEmail.textContent = "";
            }

            currentStep++;
            updateProgress();
            setTimeout(() => {
                stepsContainer.style.height = steps[currentStep].scrollHeight + "px";
            }, 50);

        } catch (err) {
            console.error("Submit error:", err);
            showError("Could not submit RSVP. Please try again.");
            submitButton.textContent = "COMPLETE";
            submitButton.disabled = false;
        }
    });

    // ── ACCEPT / DECLINE ──────────────────────────────────────────
    acceptBtn.onclick = () => {
        addRemoveActive(declineBtn, acceptBtn);
        responseSelected = true;
        postToSheet({ first: currentGuest?.first, last: currentGuest?.last, response: "yes" });
    };

    declineBtn.onclick = () => {
        addRemoveActive(acceptBtn, declineBtn);
        responseSelected = true;
        postToSheet({ first: currentGuest?.first, last: currentGuest?.last, response: "no" });

        // Uncheck plus one if declining
        const plusOneCheckbox = document.getElementById("plus-one");
        if (plusOneCheckbox && plusOneCheckbox.checked) {
            plusOneCheckbox.checked = false;
            const plusOneArea = document.querySelector(".plus-one-area");
            if (plusOneArea) plusOneArea.style.display = "none";
            stepsContainer.style.height = steps[currentStep].scrollHeight + "px";
        }
    };

    // ── TAB HANDLING ──────────────────────────────────────────────
    document.querySelector(".form-wizard").addEventListener("keydown", (e) => {
        if (e.key !== "Tab") return;
        e.preventDefault();
        const currentStepEl = steps[currentStep];
        const stepFocusable = Array.from(currentStepEl.querySelectorAll(
            'input, select, textarea, button'
        )).filter(el => !el.disabled);
        const visibleButton = [findButton, continueButton, submitButton]
            .find(btn => btn.style.display === "block");
        const focusable = visibleButton ? [...stepFocusable, visibleButton] : stepFocusable;
        if (focusable.length === 0) return;
        const currentIndex = focusable.indexOf(document.activeElement);
        if (e.shiftKey) {
            const prevIndex = currentIndex <= 0 ? focusable.length - 1 : currentIndex - 1;
            focusable[prevIndex].focus();
        } else {
            const nextIndex = currentIndex >= focusable.length - 1 ? 0 : currentIndex + 1;
            focusable[nextIndex].focus();
        }
    });

    updateProgress();
});