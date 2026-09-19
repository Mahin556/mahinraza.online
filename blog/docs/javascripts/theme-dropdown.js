document.addEventListener("DOMContentLoaded", () => {
  const options = [
    { value: "light", label: "Light", icon: `<svg viewBox="0 0 24 24" width="16" height="16"><circle cx="12" cy="12" r="5" fill="currentColor"/><g stroke="currentColor" stroke-width="2"><line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/><line x1="4.2" y1="4.2" x2="5.6" y2="5.6"/><line x1="18.4" y1="18.4" x2="19.8" y2="19.8"/><line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/><line x1="4.2" y1="19.8" x2="5.6" y2="18.4"/><line x1="18.4" y1="5.6" x2="19.8" y2="4.2"/></g></svg>` },
    { value: "dark", label: "Dark", icon: `<svg viewBox="0 0 24 24" width="16" height="16"><path fill="currentColor" d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/></svg>` },
    { value: "auto", label: "Auto", icon: `<svg viewBox="0 0 24 24" width="16" height="16"><circle cx="12" cy="12" r="9" fill="none" stroke="currentColor" stroke-width="2"/><path fill="currentColor" d="M12 3a9 9 0 0 0 0 18z"/></svg>` },
  ];

  const saved = localStorage.getItem("theme-pref") || "auto";

  const wrapper = document.createElement("div");
  wrapper.className = "theme-dropdown";

  const button = document.createElement("button");
  button.className = "theme-dropdown__toggle";
  button.type = "button";
  button.setAttribute("aria-label", "Switch theme");
  wrapper.appendChild(button);

  const menu = document.createElement("ul");
  menu.className = "theme-dropdown__menu";
  options.forEach(opt => {
    const li = document.createElement("li");
    li.className = "theme-dropdown__item";
    li.dataset.value = opt.value;
    li.innerHTML = `<span class="theme-dropdown__icon">${opt.icon}</span><span>${opt.label}</span>`;
    li.addEventListener("click", () => {
      setTheme(opt.value);
      wrapper.classList.remove("open");
    });
    menu.appendChild(li);
  });
  wrapper.appendChild(menu);

  // NEW — inserts before the search bar (left side of search)
  const header = document.querySelector(".md-header__inner");
  const search = header.querySelector(".md-search");
  if (search) {
    header.insertBefore(wrapper, search);
  } else {
    header.appendChild(wrapper); // fallback if search isn't found
  }

  button.addEventListener("click", () => wrapper.classList.toggle("open"));
  document.addEventListener("click", (e) => {
    if (!wrapper.contains(e.target)) wrapper.classList.remove("open");
  });

  function setTheme(value) {
    localStorage.setItem("theme-pref", value);
    const opt = options.find(o => o.value === value);
    button.innerHTML = opt.icon;

    menu.querySelectorAll(".theme-dropdown__item").forEach(li => {
      li.classList.toggle("active", li.dataset.value === value);
    });

    let scheme = value;
    if (value === "auto") {
      scheme = window.matchMedia("(prefers-color-scheme: dark)").matches ? "slate" : "default";
    } else if (value === "dark") {
      scheme = "slate";
    } else {
      scheme = "default";
    }
    document.body.setAttribute("data-md-color-scheme", scheme);
  }

  setTheme(saved);
});