(() => {
  const root = document.documentElement;
  const body = document.body;
  const header = document.getElementById("site-header");
  const progressBar = document.getElementById("scroll-progress-bar");
  const themeToggle = document.getElementById("theme-toggle");
  const menuToggle = document.getElementById("menu-toggle");
  const mobileMenu = document.getElementById("mobile-menu");
  const contactForm = document.getElementById("contact-form");
  const formNote = document.getElementById("form-note");
  const year = document.getElementById("year");
  const themeStorageKey = "vinay-portfolio-theme";

  // Contact form delivery via https://web3forms.com — the key is a public alias for
  // the destination inbox, not a secret, so it is safe to commit. Manage the form (or
  // reissue the key) from the Web3Forms dashboard. If this is ever blanked out, the
  // form tells visitors to use LinkedIn instead of pretending the message was sent.
  const web3FormsAccessKey = "1569a9fa-6891-40cf-942f-ccc2cfa030c2";

  const setTheme = (theme) => {
    root.dataset.theme = theme;
    const themeColor = document.querySelector('meta[name="theme-color"]');
    if (themeColor) themeColor.content = theme === "dark" ? "#141923" : "#ffffff";
    if (themeToggle) {
      themeToggle.setAttribute(
        "aria-label",
        theme === "dark" ? "Switch to light theme" : "Switch to dark theme"
      );
    }
  };

  try {
    setTheme(localStorage.getItem(themeStorageKey) || "dark");
  } catch {
    setTheme("dark");
  }

  themeToggle?.addEventListener("click", () => {
    const nextTheme = root.dataset.theme === "dark" ? "light" : "dark";
    setTheme(nextTheme);
    try {
      localStorage.setItem(themeStorageKey, nextTheme);
    } catch {
      // The visual setting still changes if browser storage is unavailable.
    }
  });

  const closeMenu = () => {
    if (!menuToggle || !mobileMenu) return;
    menuToggle.classList.remove("is-open");
    menuToggle.setAttribute("aria-expanded", "false");
    menuToggle.setAttribute("aria-label", "Open navigation menu");
    mobileMenu.hidden = true;
    header?.classList.remove("menu-active");
    body.classList.remove("menu-open");
  };

  menuToggle?.addEventListener("click", () => {
    if (!mobileMenu) return;
    const willOpen = mobileMenu.hidden;
    mobileMenu.hidden = !willOpen;
    menuToggle.classList.toggle("is-open", willOpen);
    menuToggle.setAttribute("aria-expanded", String(willOpen));
    menuToggle.setAttribute("aria-label", willOpen ? "Close navigation menu" : "Open navigation menu");
    header?.classList.toggle("menu-active", willOpen);
    body.classList.toggle("menu-open", willOpen);
  });

  mobileMenu?.querySelectorAll("a").forEach((link) => {
    link.addEventListener("click", closeMenu);
  });

  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape") closeMenu();
  });

  window.addEventListener("resize", () => {
    if (window.innerWidth > 860) closeMenu();
  });

  const updateScrollState = () => {
    const scrollTop = window.scrollY || document.documentElement.scrollTop;
    const scrollHeight = document.documentElement.scrollHeight - window.innerHeight;
    const progress = scrollHeight > 0 ? (scrollTop / scrollHeight) * 100 : 0;
    if (progressBar) progressBar.style.width = String(Math.min(100, Math.max(0, progress))) + "%";
    header?.classList.toggle("is-scrolled", scrollTop > 12);
  };

  updateScrollState();
  window.addEventListener("scroll", updateScrollState, { passive: true });

  body.classList.add("js-ready");
  const revealItems = document.querySelectorAll("[data-reveal]");

  if ("IntersectionObserver" in window) {
    const revealObserver = new IntersectionObserver(
      (entries, observer) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;
          entry.target.classList.add("is-visible");
          observer.unobserve(entry.target);
        });
      },
      { threshold: 0.12, rootMargin: "0px 0px -30px" }
    );
    revealItems.forEach((item) => revealObserver.observe(item));
  } else {
    revealItems.forEach((item) => item.classList.add("is-visible"));
  }

  const navLinks = [...document.querySelectorAll(".desktop-nav a")];
  const trackedSections = ["home", "about", "expertise", "portfolio", "resume", "contact"]
    .map((id) => document.getElementById(id))
    .filter(Boolean);

  if ("IntersectionObserver" in window) {
    const navObserver = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((entry) => entry.isIntersecting)
          .sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];
        if (!visible) return;
        navLinks.forEach((link) => {
          link.classList.toggle("active", link.getAttribute("href") === "#" + visible.target.id);
        });
      },
      { rootMargin: "-30% 0px -59% 0px", threshold: [0.02, 0.18, 0.42] }
    );
    trackedSections.forEach((section) => navObserver.observe(section));
  }

  const tabButtons = [...document.querySelectorAll(".resume-tabs button")];
  const tabPanels = [...document.querySelectorAll(".resume-panel")];

  const activateTab = (button) => {
    const targetId = button.getAttribute("aria-controls");
    tabButtons.forEach((tab) => {
      const isActive = tab === button;
      tab.classList.toggle("active", isActive);
      tab.setAttribute("aria-selected", String(isActive));
      tab.tabIndex = isActive ? 0 : -1;
    });
    tabPanels.forEach((panel) => {
      panel.hidden = panel.id !== targetId;
    });
  };

  tabButtons.forEach((button) => {
    button.addEventListener("click", () => activateTab(button));
    button.addEventListener("keydown", (event) => {
      if (!["ArrowLeft", "ArrowRight"].includes(event.key)) return;
      event.preventDefault();
      const currentIndex = tabButtons.indexOf(button);
      const direction = event.key === "ArrowRight" ? 1 : -1;
      const next = tabButtons[(currentIndex + direction + tabButtons.length) % tabButtons.length];
      next.focus();
      activateTab(next);
    });
  });

  const createCertificateViewer = (dialog) => {
    const viewer = dialog?.querySelector("[data-certificate-viewer]");
    const toggle = viewer?.querySelector(".certificate-toggle");
    const preview = viewer?.querySelector(".certificate-preview");
    const previewImage = viewer?.querySelector(".certificate-document-image");
    let previewSource = "";

    const reset = () => {
      previewSource = "";
      if (viewer) viewer.hidden = true;
      if (toggle) {
        toggle.setAttribute("aria-expanded", "false");
        toggle.textContent = "Show certificate";
      }
      if (preview) preview.hidden = true;
      if (previewImage) {
        previewImage.removeAttribute("src");
        previewImage.alt = "";
      }
    };

    toggle?.addEventListener("click", () => {
      if (!preview || !previewImage || !previewSource) return;
      const willExpand = preview.hidden;
      if (willExpand && !previewImage.hasAttribute("src")) {
        previewImage.src = previewSource;
      }
      preview.hidden = !willExpand;
      toggle.setAttribute("aria-expanded", String(willExpand));
      toggle.textContent = willExpand ? "Hide certificate" : "Show certificate";
    });

    reset();

    return {
      reset,
      prepare(trigger) {
        reset();
        const { certificatePreview, certificateName } = trigger.dataset;
        if (!viewer || !previewImage || !certificatePreview) return;
        previewSource = certificatePreview;
        const documentName = certificateName || "Certificate";
        previewImage.alt = documentName;
        viewer.hidden = false;
      },
    };
  };

  const certificationDialog = document.getElementById("certification-dialog");
  const certificationDialogClose = document.getElementById("certification-dialog-close");
  const certificationButtons = [...document.querySelectorAll(".certification-badge-card")];
  const certificationDialogTitle = document.getElementById("certification-dialog-title");
  const certificationDialogIssuer = document.getElementById("certification-dialog-issuer");
  const certificationDialogIssued = document.getElementById("certification-dialog-issued");
  const certificationDialogIssuedRow = document.getElementById("certification-dialog-issued-row");
  const certificationDialogExpires = document.getElementById("certification-dialog-expires");
  const certificationDialogId = document.getElementById("certification-dialog-id");
  const certificationDialogIdLabel = document.getElementById("certification-dialog-id-label");
  const certificationDialogBadgeImage = document.getElementById("certification-dialog-badge-image");
  const certificationViewer = createCertificateViewer(certificationDialog);
  let certificationTrigger = null;

  const closeCertificationDialog = () => {
    if (!certificationDialog?.open) return;
    certificationDialog.close();
  };

  certificationButtons.forEach((button) => {
    button.addEventListener("click", () => {
      if (!certificationDialog) return;
      certificationTrigger = button;
      certificationDialog.style.setProperty("--certificate-accent", getComputedStyle(button).getPropertyValue("--certificate-accent"));

      if (certificationDialogTitle) certificationDialogTitle.textContent = button.dataset.certificationTitle || "Certification";
      if (certificationDialogIssuer) certificationDialogIssuer.textContent = button.dataset.certificationIssuer || "";
      if (certificationDialogIssued) certificationDialogIssued.textContent = button.dataset.certificationIssued || "";
      if (certificationDialogIssuedRow) certificationDialogIssuedRow.hidden = !button.dataset.certificationIssued;
      if (certificationDialogExpires) certificationDialogExpires.textContent = button.dataset.certificationExpires || "—";
      if (certificationDialogId) certificationDialogId.textContent = button.dataset.certificationId || "—";
      if (certificationDialogIdLabel) certificationDialogIdLabel.textContent = `${button.dataset.certificationIdLabel || "Credential ID"}:`;
      if (certificationDialogBadgeImage) {
        certificationDialogBadgeImage.src = button.dataset.badgeImage || "assets/certifications/azure-fundamentals.png";
      }

      certificationViewer.prepare(button);
      certificationDialog.showModal();
      certificationDialog.scrollTop = 0;
      certificationDialogClose?.focus();
    });
  });

  certificationDialogClose?.addEventListener("click", closeCertificationDialog);

  certificationDialog?.addEventListener("click", (event) => {
    const bounds = certificationDialog.getBoundingClientRect();
    const clickedBackdrop =
      event.target === certificationDialog &&
      (event.clientX < bounds.left || event.clientX > bounds.right || event.clientY < bounds.top || event.clientY > bounds.bottom);
    if (clickedBackdrop) closeCertificationDialog();
  });

  certificationDialog?.addEventListener("close", () => {
    certificationViewer.reset();
    certificationTrigger?.focus();
    certificationTrigger = null;
  });

  const recognitionDialog = document.getElementById("recognition-dialog");
  const recognitionCard = document.getElementById("recognition-card");
  const recognitionDialogClose = document.getElementById("recognition-dialog-close");
  const recognitionViewer = createCertificateViewer(recognitionDialog);

  const closeRecognitionDialog = () => {
    if (!recognitionDialog?.open) return;
    recognitionDialog.close();
  };

  recognitionCard?.addEventListener("click", () => {
    if (!recognitionDialog) return;
    recognitionViewer.prepare(recognitionCard);
    recognitionDialog.showModal();
    recognitionDialog.scrollTop = 0;
    recognitionDialogClose?.focus();
  });

  recognitionDialogClose?.addEventListener("click", closeRecognitionDialog);

  recognitionDialog?.addEventListener("click", (event) => {
    const bounds = recognitionDialog.getBoundingClientRect();
    const clickedBackdrop =
      event.target === recognitionDialog &&
      (event.clientX < bounds.left || event.clientX > bounds.right || event.clientY < bounds.top || event.clientY > bounds.bottom);
    if (clickedBackdrop) closeRecognitionDialog();
  });

  recognitionDialog?.addEventListener("close", () => {
    recognitionViewer.reset();
    recognitionCard?.focus();
  });

  const setFormNote = (text, state) => {
    if (!formNote) return;
    formNote.textContent = text;
    formNote.classList.toggle("is-success", state === "success");
    formNote.classList.toggle("is-error", state === "error");
  };

  contactForm?.addEventListener("submit", async (event) => {
    event.preventDefault();
    const submitButton = contactForm.querySelector('button[type="submit"]');
    const fields = Object.fromEntries(new FormData(contactForm).entries());

    // Only a bot fills the hidden checkbox, so drop the submission without feedback.
    if (fields.botcheck) return;

    if (!web3FormsAccessKey || web3FormsAccessKey.startsWith("PASTE-")) {
      setFormNote(
        "This form isn’t connected to email yet — please reach me on LinkedIn or GitHub in the meantime.",
        "error"
      );
      return;
    }

    submitButton?.setAttribute("disabled", "");
    setFormNote("Sending your message…");

    try {
      const response = await fetch("https://api.web3forms.com/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json", Accept: "application/json" },
        body: JSON.stringify({
          name: fields.name,
          email: fields.email,
          message: fields.message,
          access_key: web3FormsAccessKey,
          subject: `Portfolio enquiry from ${fields.name || "a visitor"}`,
        }),
      });
      const result = await response.json().catch(() => ({}));
      if (!response.ok || !result.success) throw new Error(result.message || "Submission failed");
      setFormNote("Thanks — your message is on its way. I’ll get back to you soon.", "success");
      contactForm.reset();
    } catch {
      setFormNote(
        "Something went wrong sending that. Please try again, or reach me on LinkedIn or GitHub.",
        "error"
      );
    } finally {
      submitButton?.removeAttribute("disabled");
    }
  });

  if (year) year.textContent = new Date().getFullYear();
})();
