const appType = document.body.dataset.app;

const storage = {
  get(key, fallback) {
    try {
      return JSON.parse(localStorage.getItem(key)) ?? fallback;
    } catch {
      return fallback;
    }
  },
  set(key, value) {
    localStorage.setItem(key, JSON.stringify(value));
  },
  remove(key) {
    localStorage.removeItem(key);
  },
};

const escapeHtml = (value) =>
  String(value).replace(/[&<>"']/g, (char) => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#039;",
  })[char]);

const setActiveButton = (buttons, activeButton) => {
  buttons.forEach((button) => button.classList.remove("is-active"));
  activeButton.classList.add("is-active");
};

const showToast = (message) => {
  let toast = document.querySelector(".toast");
  if (!toast) {
    toast = document.createElement("div");
    toast.className = "toast";
    toast.setAttribute("role", "status");
    document.body.appendChild(toast);
  }

  toast.textContent = message;
  toast.classList.add("is-visible");
  window.clearTimeout(showToast.timer);
  showToast.timer = window.setTimeout(() => toast.classList.remove("is-visible"), 2600);
};

const supportSeed = [
  { id: 1041, customer: "Aman Verma", channel: "Chat", category: "Payments", priority: "High", status: "Open" },
  { id: 1042, customer: "Neha Singh", channel: "Email", category: "Delivery", priority: "Normal", status: "Resolved" },
  { id: 1043, customer: "Rohit Mehra", channel: "Voice", category: "Refunds", priority: "Urgent", status: "Escalated" },
];

const initSupportDashboard = () => {
  const form = document.querySelector("[data-ticket-form]");
  const list = document.querySelector("[data-ticket-list]");
  const chart = document.querySelector("[data-ticket-chart]");
  const filterButtons = document.querySelectorAll("[data-ticket-filter]");
  const resetButton = document.querySelector("[data-reset-support]");
  const totalNode = document.querySelector("[data-total-tickets]");
  const openNode = document.querySelector("[data-open-tickets]");
  const resolvedNode = document.querySelector("[data-resolved-tickets]");
  let activeFilter = "all";
  let tickets = storage.get("gk-support-tickets", supportSeed);

  const saveTickets = () => storage.set("gk-support-tickets", tickets);

  const renderChart = () => {
    const categories = ["Orders", "Payments", "Refunds", "Delivery"];
    const max = Math.max(...categories.map((category) => tickets.filter((ticket) => ticket.category === category).length), 1);
    chart.innerHTML = categories.map((category) => {
      const count = tickets.filter((ticket) => ticket.category === category).length;
      const value = `${Math.max((count / max) * 100, count ? 18 : 4)}%`;
      return `
        <div class="bar">
          <span>${category}</span>
          <div class="bar-track"><span style="--value: ${value}"></span></div>
          <strong>${count}</strong>
        </div>
      `;
    }).join("");
  };

  const renderTickets = () => {
    const visibleTickets = activeFilter === "all" ? tickets : tickets.filter((ticket) => ticket.status === activeFilter);
    totalNode.textContent = tickets.length;
    openNode.textContent = tickets.filter((ticket) => ticket.status === "Open" || ticket.status === "Escalated").length;
    resolvedNode.textContent = tickets.filter((ticket) => ticket.status === "Resolved").length;

    list.innerHTML = visibleTickets.length ? visibleTickets.map((ticket) => `
      <article class="ticket-card status-${ticket.status.toLowerCase()}">
        <div>
          <span class="category">${ticket.category}</span>
          <h3>#${ticket.id} - ${escapeHtml(ticket.customer)}</h3>
          <p>${ticket.channel} channel - ${ticket.priority} priority - <strong>${ticket.status}</strong></p>
        </div>
        <div class="ticket-actions">
          <button type="button" data-ticket-action="resolve" data-ticket-id="${ticket.id}">Resolve</button>
          <button type="button" data-ticket-action="escalate" data-ticket-id="${ticket.id}">Escalate</button>
          <button type="button" data-ticket-action="delete" data-ticket-id="${ticket.id}">Delete</button>
        </div>
      </article>
    `).join("") : `
      <div class="empty-state">
        <strong>No tickets here.</strong>
        <p>Create a new ticket or switch filters to see other cases.</p>
      </div>
    `;

    renderChart();
  };

  form.addEventListener("submit", (event) => {
    event.preventDefault();
    const data = new FormData(form);
    tickets = [{
      id: Date.now().toString().slice(-5),
      customer: data.get("customer"),
      channel: data.get("channel"),
      category: data.get("category"),
      priority: data.get("priority"),
      status: "Open",
    }, ...tickets];
    saveTickets();
    form.reset();
    renderTickets();
    showToast("Ticket created and saved.");
  });

  list.addEventListener("click", (event) => {
    const button = event.target.closest("[data-ticket-action]");
    if (!button) return;
    const id = String(button.dataset.ticketId);
    const action = button.dataset.ticketAction;

    if (action === "delete") {
      tickets = tickets.filter((ticket) => String(ticket.id) !== id);
      showToast("Ticket deleted.");
    } else {
      tickets = tickets.map((ticket) => {
        if (String(ticket.id) !== id) return ticket;
        return { ...ticket, status: action === "resolve" ? "Resolved" : "Escalated" };
      });
      showToast(action === "resolve" ? "Ticket marked resolved." : "Ticket escalated.");
    }

    saveTickets();
    renderTickets();
  });

  resetButton.addEventListener("click", () => {
    tickets = supportSeed;
    saveTickets();
    renderTickets();
    showToast("Demo tickets restored.");
  });

  filterButtons.forEach((button) => {
    button.addEventListener("click", () => {
      activeFilter = button.dataset.ticketFilter;
      setActiveButton(filterButtons, button);
      renderTickets();
    });
  });

  renderTickets();
};

const analyzeFeedback = (text) => {
  const lower = text.toLowerCase();
  const rules = [
    { category: "Baggage", words: ["baggage", "bag", "luggage"] },
    { category: "Refund", words: ["refund", "money", "payment", "charged"] },
    { category: "Delay", words: ["delay", "late", "waiting", "cancelled", "cancel"] },
    { category: "Staff", words: ["staff", "crew", "agent", "helpful", "rude"] },
  ];
  const positiveWords = ["helpful", "excellent", "good", "quick", "smooth", "clear"];
  const negativeWords = ["rude", "bad", "delay", "late", "waiting", "confusing", "cancelled", "missing"];
  const match = rules.find((rule) => rule.words.some((word) => lower.includes(word)));
  const positiveScore = positiveWords.filter((word) => lower.includes(word)).length;
  const negativeScore = negativeWords.filter((word) => lower.includes(word)).length;
  const sentiment = positiveScore > negativeScore ? "Positive" : negativeScore > positiveScore ? "Negative" : "Neutral";
  const priority = negativeScore >= 2 || lower.includes("urgent") ? "High" : sentiment === "Negative" ? "Medium" : "Low";
  const category = match ? match.category : "General";
  const actionMap = {
    Baggage: "Share baggage claim status and set update frequency.",
    Refund: "Confirm refund stage and provide expected timeline.",
    Delay: "Explain reason, next step, and passenger options clearly.",
    Staff: "Route praise or complaint to the service quality team.",
    General: "Review manually and assign the right support queue.",
  };

  return {
    id: Date.now() + Math.random(),
    text,
    category,
    sentiment,
    priority,
    action: actionMap[category],
  };
};

const travelSeed = [
  analyzeFeedback("My baggage was delayed and the status update was not clear."),
  analyzeFeedback("The staff was helpful during my connection and guided me quickly."),
  analyzeFeedback("I am still waiting for my refund after the cancelled flight."),
];

const initTravelAnalyzer = () => {
  const form = document.querySelector("[data-feedback-form]");
  const textarea = form.querySelector("textarea");
  const result = document.querySelector("[data-analysis-result]");
  const list = document.querySelector("[data-feedback-list]");
  const filterButtons = document.querySelectorAll("[data-feedback-filter]");
  const sampleButton = document.querySelector("[data-sample-feedback]");
  const clearButton = document.querySelector("[data-clear-feedback]");
  let activeFilter = "all";
  let feedback = storage.get("gk-travel-feedback", travelSeed);

  const saveFeedback = () => storage.set("gk-travel-feedback", feedback);

  const renderFeedback = () => {
    const visible = activeFilter === "all" ? feedback : feedback.filter((item) => item.category === activeFilter);
    list.innerHTML = visible.length ? visible.map((item) => `
      <article class="feedback-item">
        <span class="category">${item.category}</span>
        <h3>${item.sentiment} - ${item.priority} priority</h3>
        <p>${escapeHtml(item.text)}</p>
        <p><strong>Suggested action:</strong> ${item.action}</p>
      </article>
    `).join("") : `
      <div class="empty-state">
        <strong>No feedback in this category.</strong>
        <p>Analyze a new passenger comment or switch filters.</p>
      </div>
    `;
  };

  form.addEventListener("submit", (event) => {
    event.preventDefault();
    const data = new FormData(form);
    const analyzed = analyzeFeedback(data.get("feedback"));
    feedback = [analyzed, ...feedback];
    saveFeedback();
    result.innerHTML = `
      <div class="result-grid">
        <article><span>Category</span><strong>${analyzed.category}</strong></article>
        <article><span>Sentiment</span><strong>${analyzed.sentiment}</strong></article>
        <article><span>Priority</span><strong>${analyzed.priority}</strong></article>
      </div>
      <p><strong>Suggested action:</strong> ${analyzed.action}</p>
    `;
    form.reset();
    renderFeedback();
    showToast("Feedback analyzed and saved.");
  });

  sampleButton.addEventListener("click", () => {
    textarea.value = "The flight was delayed for hours, and nobody gave a clear update about my baggage.";
    textarea.focus();
  });

  clearButton.addEventListener("click", () => {
    feedback = travelSeed;
    saveFeedback();
    renderFeedback();
    result.innerHTML = "<p>Saved feedback cleared. Try analyzing a new passenger comment.</p>";
    showToast("Saved feedback reset.");
  });

  filterButtons.forEach((button) => {
    button.addEventListener("click", () => {
      activeFilter = button.dataset.feedbackFilter;
      setActiveButton(filterButtons, button);
      renderFeedback();
    });
  });

  renderFeedback();
};

const initFoodHelpCenter = () => {
  const faqSearch = document.querySelector("[data-faq-search]");
  const faqItems = document.querySelectorAll("[data-faq]");
  const orderForm = document.querySelector("[data-order-form]");
  const orderResult = document.querySelector("[data-order-result]");
  const issueForm = document.querySelector("[data-issue-form]");
  const issueOutput = document.querySelector("[data-issue-output]");
  const clearIssuesButton = document.querySelector("[data-clear-issues]");
  let savedIssues = storage.get("gk-food-issues", []);
  const orders = {
    FD1024: { status: "Out for delivery", eta: "18 minutes", note: "Rider has picked up your order." },
    FD2048: { status: "Preparing", eta: "32 minutes", note: "Restaurant is preparing fresh items." },
    FD4096: { status: "Refund processing", eta: "2-4 business days", note: "Payment reversal has been initiated." },
  };

  const renderIssues = () => {
    issueOutput.innerHTML = savedIssues.length ? savedIssues.map((issue) => `
      <div class="app-result">
        <span class="category">${issue.id}</span>
        <h3>${escapeHtml(issue.type)}</h3>
        <p>${escapeHtml(issue.details)}</p>
        <p><strong>Next step:</strong> Support team will review this issue and share an update.</p>
      </div>
    `).join("") : `
      <div class="empty-state">
        <strong>No support tickets yet.</strong>
        <p>Create one from the form to see the saved ticket summary here.</p>
      </div>
    `;
  };

  faqSearch.addEventListener("input", () => {
    const query = faqSearch.value.trim().toLowerCase();
    let visibleCount = 0;
    faqItems.forEach((item) => {
      const shouldShow = item.textContent.toLowerCase().includes(query);
      item.hidden = !shouldShow;
      if (shouldShow) visibleCount += 1;
    });
    if (query && visibleCount === 0) showToast("No FAQ matched that search.");
  });

  orderForm.addEventListener("submit", (event) => {
    event.preventDefault();
    const orderId = new FormData(orderForm).get("orderId").trim().toUpperCase();
    const order = orders[orderId];
    orderResult.innerHTML = order ? `
      <div class="app-result">
        <span class="category">${orderId}</span>
        <h3>${order.status}</h3>
        <p><strong>ETA:</strong> ${order.eta}</p>
        <p>${order.note}</p>
      </div>
    ` : `
      <div class="app-result">
        <span class="category">Not found</span>
        <h3>No demo order found</h3>
        <p>Try FD1024, FD2048, or FD4096.</p>
      </div>
    `;
    showToast(order ? "Order status loaded." : "Try FD1024, FD2048, or FD4096.");
  });

  issueForm.addEventListener("submit", (event) => {
    event.preventDefault();
    const data = new FormData(issueForm);
    savedIssues = [{
      id: `FOOD-${Date.now().toString().slice(-4)}`,
      type: data.get("type"),
      details: data.get("details"),
    }, ...savedIssues];
    storage.set("gk-food-issues", savedIssues);
    issueForm.reset();
    renderIssues();
    showToast("Support ticket created and saved.");
  });

  clearIssuesButton.addEventListener("click", () => {
    savedIssues = [];
    storage.remove("gk-food-issues");
    renderIssues();
    showToast("Saved support tickets cleared.");
  });

  renderIssues();
};

if (appType === "support") initSupportDashboard();
if (appType === "travel") initTravelAnalyzer();
if (appType === "food") initFoodHelpCenter();
