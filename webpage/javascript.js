document.addEventListener("DOMContentLoaded", () => {
    /* ---------- Sample data (replace with Supabase later) ---------- */
    const categories = [
        { name: "Pothole", icon: "🕳", dept: "Roads" },
        { name: "Water leak", icon: "💧", dept: "Water" },
        { name: "Power cut", icon: "⚡", dept: "Power" },
        { name: "Garbage pile", icon: "🗑", dept: "Garbage" },
        { name: "Blocked drain", icon: "🌊", dept: "Drainage" },
        { name: "Broken street light", icon: "", dept: "Lights" }
    ];

    const resolved = [
        { title: "Pothole fixed on Main Road", date: "16 Oct 2026", ward: "Ward 4" },
        { title: "Water leak repaired", date: "15 Oct 2026", ward: "Ward 9" },
        { title: "Street light replaced", date: "14 Oct 2026", ward: "Ward 2" }
    ];

    const wards = [
        { name: "Ward 4", onTime: "94%" },
        { name: "Ward 9", onTime: "91%" },
        { name: "Ward 2", onTime: "88%" }
    ];

    const tickets = {
        "LL-1042": {
            category: "Pothole",
            location: "Main Road, near Gate 2",
            status: "in-progress",
            due: "22 Oct 2026",
            owner: "Roads Department",
            steps: [
                { text: "Ticket submitted", date: "12 Oct 2026", done: true },
                { text: "Assigned to Roads Department", date: "13 Oct 2026", done: true },
                { text: "Work in progress", date: "16 Oct 2026", done: true },
                { text: "Resolution confirmed", date: "Pending", done: false }
            ]
        },
        "LL-1043": {
            category: "Water leak",
            location: "Park Lane, Block C",
            status: "resolved",
            due: "17 Oct 2026",
            owner: "Water Department",
            steps: [
                { text: "Ticket submitted", date: "10 Oct 2026", done: true },
                { text: "Assigned to Water Department", date: "11 Oct 2026", done: true },
                { text: "Repair completed", date: "15 Oct 2026", done: true },
                { text: "Citizen confirmed fix", date: "16 Oct 2026", done: true }
            ]
        }
    };

    /* ---------- Helpers ---------- */
    const $ = (id) => document.getElementById(id);
    const statusBadge = {
        overdue: ["badge-red", "Overdue"],
        "in-progress": ["badge-amber", "In progress"],
        resolved: ["badge-green", "Resolved"]
    };

    /* ---------- Render categories (home + report) ---------- */
    function renderCategories(containerId, onPick) {
        const box = $(containerId);
        box.innerHTML = "";
        categories.forEach((cat) => {
            const card = document.createElement("button");
            card.type = "button";
            card.className = "category-card";
            card.innerHTML = `<span class="icon">${cat.icon}</span>${cat.name}`;
            card.addEventListener("click", () => onPick(cat, card));
            box.appendChild(card);
        });
    }

    renderCategories("homeCategories", () => {
        showView("report");
        goToStep(1);
    });

    let selectedCategory = null;
    renderCategories("reportCategories", (cat, card) => {
        selectedCategory = cat;
        document.querySelectorAll("#reportCategories .category-card")
            .forEach((c) => c.classList.remove("selected"));
        card.classList.add("selected");
    });

    /* ---------- Render resolved + wards ---------- */
    $("resolvedList").innerHTML = resolved.map((r) => `
    <div class="resolved-card">
      <div class="thumb"></div>
      <div class="body">
        <strong>${r.title}</strong>
        <small>${r.ward} - ${r.date}</small>
      </div>
    </div>`).join("");

    $("wardList").innerHTML = wards.map((w, i) => `
    <tr><td>${i + 1}</td><td>${w.name}</td><td>${w.onTime}</td></tr>`).join("");

    /* ---------- Views and routing ---------- */
    function showView(id) {
        document.querySelectorAll(".view").forEach((v) => v.classList.remove("active"));
        $(id).classList.add("active");
        window.scrollTo({ top: 0, behavior: "smooth" });
    }

    function route() {
        const hash = location.hash.replace("#", "") || "home";
        if (hash === "map") {
            showView("home");
            setTimeout(() => $("map").scrollIntoView({ behavior: "smooth" }), 50);
        } else if (["home", "report", "track"].includes(hash)) {
            showView(hash);
        } else {
            showView("home");
        }
    }
    window.addEventListener("hashchange", route);
    route();

    /* ---------- Report flow (3 steps + confirmation) ---------- */
    let currentStep = 1;
    const totalSteps = 3;

    function goToStep(n) {
        currentStep = n;
        document.querySelectorAll(".report-step").forEach((s) => {
            s.classList.toggle("active", Number(s.dataset.step) === n);
        });
        if (n <= totalSteps) {
            $("progressBar").style.width = `${(n / totalSteps) * 100}%`;
            $("stepLabel").textContent = `Step ${n} of ${totalSteps}`;
        } else {
            $("progressBar").style.width = "100%";
            $("stepLabel").textContent = "Done";
        }
        $("prevBtn").style.visibility = n === 1 ? "hidden" : "visible";
        $("nextBtn").textContent = n === totalSteps ? "Submit" : "Next";
        $("nextBtn").style.display = n > totalSteps ? "none" : "inline-block";
        $("prevBtn").style.display = n > totalSteps ? "none" : "inline-block";
    }

    $("photoInput").addEventListener("change", (e) => {
        const file = e.target.files[0];
        if (!file) return;
        $("photoPreview").src = URL.createObjectURL(file);
        $("photoPreview").hidden = false;
        $("photoText").textContent = file.name;
    });

    $("speakBtn").addEventListener("click", () => {
        const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
        if (!SR) {
            alert("Voice input is not supported in this browser. Please type your note.");
            return;
        }
        const rec = new SR();
        rec.lang = "en-IN";
        rec.onresult = (e) => {
            $("description").value = e.results[0][0].transcript;
        };
        rec.start();
    });

    $("locateBtn").addEventListener("click", () => {
        if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition((pos) => {
                const { latitude, longitude } = pos.coords;
                $("location").value = `Lat: ${latitude.toFixed(5)}, Lon: ${longitude.toFixed(5)}`;
            }, (err) => {
                alert("Unable to retrieve your location. Please enter it manually.");
            });
        } else {
            alert("Geolocation is not supported by your browser. Please enter your location manually.");
        }
    });
    /* ---------- Report navigation ---------- */
    $("prevBtn").addEventListener("click", () => {
        if (currentStep > 1) goToStep(currentStep - 1);
    });

    $("nextBtn").addEventListener("click", () => {
        if (currentStep === 1 && !selectedCategory) {
            alert("Please select a category to continue.");
            return;
        }
        if (currentStep < totalSteps) {
            goToStep(currentStep + 1);
            return;
        }
        submitReport();
    });

    /* ---------- Submit a new report ---------- */
    function generateTicketId() {
        const numbers = Object.keys(tickets).map((id) => parseInt(id.split("-")[1], 10));
        const next = Math.max(1042, ...numbers) + 1;
        return `LL-${next}`;
    }

    function futureDate(days) {
        const d = new Date();
        d.setDate(d.getDate() + days);
        return d.toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });
    }

    function submitReport() {
        const description = $("description").value.trim();
        const location = $("location").value.trim();

        if (!location) {
            alert("Please enter a location before submitting.");
            return;
        }

        const today = futureDate(0);
        const ticketId = generateTicketId();

        tickets[ticketId] = {
            category: selectedCategory.name,
            location,
            description,
            status: "in-progress",
            due: futureDate(7),
            owner: `${selectedCategory.dept} Department`,
            steps: [
                { text: "Ticket submitted", date: today, done: true },
                { text: `Assigned to ${selectedCategory.dept} Department`, date: "Pending", done: false },
                { text: "Work in progress", date: "Pending", done: false },
                { text: "Resolution confirmed", date: "Pending", done: false }
            ]
        };

        $("ticketId").textContent = ticketId;
        goToStep(totalSteps + 1);
    }

    function resetReport() {
        selectedCategory = null;
        document.querySelectorAll("#reportCategories .category-card")
            .forEach((c) => c.classList.remove("selected"));
        $("description").value = "";
        $("location").value = "";
        $("photoInput").value = "";
        $("photoPreview").hidden = true;
        $("photoPreview").src = "";
        $("photoText").textContent = "";
        goToStep(1);
    }

    if ($("newReportBtn")) {
        $("newReportBtn").addEventListener("click", resetReport);
    }

    /* ---------- Ticket tracking ---------- */
    function getDisplayStatus(ticket) {
        if (ticket.status === "in-progress") {
            const due = new Date(ticket.due);
            const today = new Date();
            today.setHours(0, 0, 0, 0);
            if (!isNaN(due) && due < today) return "overdue";
        }
        return ticket.status;
    }

    function renderTicket(id) {
        const box = $("trackResult");
        const ticket = tickets[id];

        if (!ticket) {
            box.innerHTML = `<p class="error">No ticket found for "${id}". Please check the ID and try again.</p>`;
            return;
        }

        const [badgeClass, badgeLabel] = statusBadge[getDisplayStatus(ticket)];

        box.innerHTML = `
          <div class="ticket-card">
            <h3>${id}</h3>
            <p><strong>${ticket.category}</strong> at ${ticket.location}</p>
            <span class="badge ${badgeClass}">${badgeLabel}</span>
            <p>Owner: ${ticket.owner}</p>
            <p>Due: ${ticket.due}</p>
            <ol class="timeline">
              ${ticket.steps.map((s) => `
                <li class="${s.done ? "done" : ""}">
                  ${s.text} <small>${s.date}</small>
                </li>`).join("")}
            </ol>
          </div>`;
    }

    function trackTicket() {
        const id = $("ticketInput").value.trim().toUpperCase();
        if (!id) {
            alert("Please enter your ticket ID.");
            return;
        }
        renderTicket(id);
    }

    $("trackBtn").addEventListener("click", trackTicket);
    $("ticketInput").addEventListener("keydown", (e) => {
        if (e.key === "Enter") trackTicket();
    });

    /* Pre-fill a sample ticket so the tracker shows something on load */
    if ($("ticketInput")) {
        $("ticketInput").value = "LL-1042";
        renderTicket("LL-1042");
    }
});