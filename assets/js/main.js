document.addEventListener("DOMContentLoaded", function () {
  const participantsList = document.getElementById("participants-list");
  const rolesList = document.getElementById("roles-list");
  const groupSizeInput = document.getElementById("group-size");
  const outputContainer = document.getElementById("output-container");
  let groupCount = 1;

  // default values
  const defaultParticipants = ["Person 1", "Person 2", "Person 3"];
  const defaultRoles = ["Rhythm", "Melody", "Samples", "Visuals"];

  // helper functions
  function escapeHTML(str) {
    const div = document.createElement("div");
    div.appendChild(document.createTextNode(str));
    return div.innerHTML;
  }

  function shuffle(arr) {
    for (let i = arr.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    return arr;
  }

  // click to toggle, hold to rename
  function addHoldToRename(btn, label) {
    let timer = null;

    btn.addEventListener("mousedown", function () {
      timer = setTimeout(function () {
        timer = null;
        const newName = prompt("Rename " + label + ":", btn.textContent);
        if (newName && newName.trim()) btn.textContent = newName.trim();
      }, 500);
    });

    btn.addEventListener("mouseup", function () {
      if (timer) {
        clearTimeout(timer);
        timer = null;
        btn.classList.toggle("disabled");
      }
    });

    btn.addEventListener("mouseleave", function () {
      if (timer) {
        clearTimeout(timer);
        timer = null;
      }
    });
  }

  // participants
  function createParticipantRow(name) {
    const li = document.createElement("li");

    const nameBtn = document.createElement("button");
    nameBtn.className = "participant-btn";
    nameBtn.textContent = name;
    addHoldToRename(nameBtn, "participant");

    const excludedInput = document.createElement("input");
    excludedInput.type = "text";
    excludedInput.className = "participant-excluded";
    excludedInput.placeholder = "Insert roles to exclude separated by ‘,’";

    const removeBtn = document.createElement("button");
    removeBtn.className = "remove-btn";
    removeBtn.textContent = "−";
    removeBtn.addEventListener("click", function () {
      li.remove();
    });

    li.appendChild(removeBtn);
    li.appendChild(nameBtn);
    li.appendChild(excludedInput);
    participantsList.appendChild(li);
  }

  // roles
  function createRoleRow(name) {
    const li = document.createElement("li");

    const roleBtn = document.createElement("button");
    roleBtn.className = "role-btn";
    roleBtn.textContent = name;
    addHoldToRename(roleBtn, "role");

    const removeBtn = document.createElement("button");
    removeBtn.className = "remove-btn";
    removeBtn.textContent = "−";
    removeBtn.addEventListener("click", function () {
      li.remove();
    });

    li.appendChild(removeBtn);
    li.appendChild(roleBtn);
    rolesList.appendChild(li);
  }

  // add buttons
  document.getElementById("add-participant").addEventListener("click", function () {
    const name = prompt("Participant name:");
    if (name && name.trim()) createParticipantRow(name.trim());
  });

  document.getElementById("add-role").addEventListener("click", function () {
    const name = prompt("Role name:");
    if (name && name.trim()) createRoleRow(name.trim());
  });

  // sync participants to group size
  groupSizeInput.addEventListener("input", function () {
    const target = parseInt(groupSizeInput.value, 10) || 1;
    const items = Array.from(participantsList.querySelectorAll("li"));

    if (target > items.length) {
      for (let i = items.length + 1; i <= target; i++) {
        createParticipantRow("Person " + i);
      }
    } else if (target < items.length) {
      let toRemove = items.length - target;
      for (let i = items.length - 1; i >= 0 && toRemove > 0; i--) {
        const name = items[i].querySelector(".participant-btn").textContent;
        if (/^Person \d+$/.test(name)) {
          items[i].remove();
          toRemove--;
        }
      }
    }
  });

  // randomise
  document.getElementById("randomiseBtn").addEventListener("click", function () {
    const groupName = document.getElementById("group-name").value || "Group " + groupCount++;
    const groupSize = parseInt(groupSizeInput.value, 10);

    // determine active participants
    const participants = Array.from(participantsList.querySelectorAll("li:has(.participant-btn:not(.disabled))")).map(
      function (li) {
        const name = li.querySelector(".participant-btn").textContent;
        const excluded = li.querySelector(".participant-excluded").value;
        return {
          name: name,
          excludedRoles: excluded
            ? excluded
                .split(",")
                .map(function (r) {
                  return r.trim().toLowerCase();
                })
                .filter(Boolean)
            : [],
        };
      },
    );

    // determine active roles
    const roles = Array.from(rolesList.querySelectorAll(".role-btn:not(.disabled)")).map(function (btn) {
      return btn.textContent;
    });

    if (participants.length === 0) {
      outputContainer.innerHTML = '<div class="roles-placeholder"><p>No active participants</p></div>';
      return;
    }

    const picked = shuffle(participants).slice(0, groupSize);
    const pickedRoles = shuffle(roles).slice(0, groupSize);

    // assign roles
    let assigned;
    let attempts = 0;
    do {
      assigned = picked.map(function (p) {
        const available = pickedRoles.filter(function (r) {
          return !p.excludedRoles.includes(r.toLowerCase());
        });
        return {
          name: p.name,
          role: available[Math.floor(Math.random() * available.length)] || "Your pick :-)",
        };
      });
      attempts++;
    } while (
      groupSize >= 3 &&
      assigned.every(function (a) {
        return a.role === assigned[0].role;
      }) &&
      attempts < 100
    );

    // render output
    outputContainer.innerHTML =
      '<div class="group-name"><h2>' +
      escapeHTML(groupName) +
      "</h2></div>" +
      '<ul class="roles">' +
      assigned
        .map(function (a) {
          return "<li><p>" + escapeHTML(a.name) + "</p><p>" + escapeHTML(a.role) + "</p></li>";
        })
        .join("") +
      "</ul>";
  });

  // seed default values
  defaultParticipants.forEach(createParticipantRow);
  defaultRoles.forEach(createRoleRow);
});
