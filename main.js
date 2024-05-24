// DOM Elements
const leaveRestForm = document.getElementById("LeaveRequestForm"),
  firstName = document.getElementById("FirstName"),
  lastName = document.getElementById("LastName"),
  employeeID = document.getElementById("EmployeeID"),
  initialRemainingDays = document.getElementById("RemainingDays"),
  startDate = document.getElementById("StartDate"),
  endDate = document.getElementById("EndDate");

// Web Speech API
let synth = window.speechSynthesis;

// Function to speak text
function speakText(text) {
  let utterThis = new SpeechSynthesisUtterance(text);
  let voices = synth.getVoices();
  let femaleVoice = voices.find(voice => voice.name.includes('Google UK English Female'));
  if (femaleVoice) {
    utterThis.voice = femaleVoice;
  }
  utterThis.rate = 1.1;
  utterThis.pitch = 1;
  utterThis.volume = .4;
  synth.speak(utterThis);
}

// Add event listeners to the input fields
firstName.addEventListener('focus', () => speakText('Enter your first name here.'));
lastName.addEventListener('focus', () => speakText('Enter your last name here.'));
employeeID.addEventListener('focus', () => speakText('Enter your employee ID here.'));
initialRemainingDays.addEventListener('focus', () => speakText('Enter your initial remaining leave days here.'));
startDate.addEventListener('focus', () => speakText('Enter the start date of your leave here.'));
endDate.addEventListener('focus', () => speakText('Enter the end date of your leave here.'));

// Add event listener to the form for form submission
leaveRestForm.addEventListener('submit', function(e) {
  e.preventDefault();
  if (
    firstName.value.trim() === "" ||
    lastName.value.trim() === "" ||
    employeeID.value.trim() === "" ||
    initialRemainingDays.value.trim() === "" ||
    startDate.value.trim() === "" ||
    endDate.value.trim() === ""
  ) {
    alert("Complete all fields!");
    speakText("Please complete all fields before submitting the form.");
  } else {
    createLeaveRequest();
  }
});

async function createLeaveRequest() {
  const formData = {
    firstName: firstName.value,
    lastName: lastName.value,
    employeeID: employeeID.value,
    initialRemainingDays: initialRemainingDays.value,
    startDate: startDate.value,
    endDate: endDate.value,
    leaveDays: calculateLeaveDays(startDate.value, endDate.value),
    remainingLeaveDays: calculateRemainingLeaveDays(initialRemainingDays.value),
    submissionTimeStamp: getSubmissionTimeStamp(),
    status: 'Pending'
  };

  try {
    await saveLeaveRequestToGithub(formData);
    displayLeaveMessage('submitted', formData);
  } catch (error) {
    alert("Error saving leave request: " + error.message);
    console.error(error);
  }
}

function getSubmissionTimeStamp() {
  const today = new Date();
  const date = `${today.getFullYear()}-${(today.getMonth() + 1).toString().padStart(2, '0')}-${today.getDate().toString().padStart(2, '0')}`;
  const time = ` ${today.getHours().toString().padStart(2, '0')}:${today.getMinutes().toString().padStart(2, '0')}:${today.getSeconds().toString().padStart(2, '0')}`;
  const dateTime = `${date} / ${time}`;
  return dateTime;
}

function calculateLeaveDays(start, end) {
  const startDate = new Date(start);
  const endDate = new Date(end);
  let leaveDays = endDate.workingDaysFrom(startDate);
  return leaveDays;
}

function calculateRemainingLeaveDays(initialRemainingDays) {
  return initialRemainingDays - calculateLeaveDays(startDate.value, endDate.value);
}

Date.prototype.workingDaysFrom = function(fromDate) {
  if (!fromDate || isNaN(fromDate) || this < fromDate) {
    return -1;
  }
  let frDay = new Date(fromDate.getTime()),
    toDay = new Date(this.getTime()),
    numOfWorkingDays = 1;
  frDay.setHours(0, 0, 0, 0);
  toDay.setHours(0, 0, 0, 0);
  while (frDay < toDay) {
    frDay.setDate(frDay.getDate() + 1);
    let day = frDay.getDay();
    if (day != 0 && day != 6) {
      numOfWorkingDays++;
    }
  }
  return numOfWorkingDays;
};

const githubToken = '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';
const owner = 'jamesvandayaganon';
const repo = 'lstc-float2024';
const leaveRequestsPath = 'data/leaveRequests.json';

async function saveLeaveRequestToGithub(newRequest) {
  const apiUrl = `https://api.github.com/repos/${owner}/${repo}/contents/${leaveRequestsPath}`;

  try {
    const response = await axios.get(apiUrl, {
      headers: {
        Authorization: `token ${githubToken}`
      }
    });

    let leaveRequests = JSON.parse(atob(response.data.content));
    leaveRequests.push(newRequest);

    const updatedContent = btoa(JSON.stringify(leaveRequests, null, 2));
    const sha = response.data.sha;

    await axios.put(apiUrl, {
      message: 'Add new leave request',
      content: updatedContent,
      sha: sha
    }, {
      headers: {
        Authorization: `token ${githubToken}`
      }
    });
  } catch (error) {
    if (error.response && error.response.status === 404) {
      const initialContent = btoa(JSON.stringify([newRequest], null, 2));
      await axios.put(apiUrl, {
        message: 'Create leaveRequests.json with initial leave request',
        content: initialContent
      }, {
        headers: {
          Authorization: `token ${githubToken}`
        }
      });
    } else {
      throw error;
    }
  }
}

function displayLeaveMessage(status, leaveRequest) {
  const message = status === 'approved' ? 'Your leave was approved' : status === 'declined' ? 'Your leave was declined' : 'Your leave request has been submitted';
  const icon = status === 'approved' ? 'bi-emoji-smile-fill' : status === 'declined' ? 'bi-emoji-frown-fill' : 'bi-emoji-smile';
  const color = status === 'approved' ? 'text-success' : status === 'declined' ? 'text-danger' : 'text-primary';

  document.querySelector(".container").innerHTML = `
    <header class="text-center mb-5">
      <i class="bi ${icon} h1 display-1 ${color} m-auto" style="font-size: 10rem"></i>
      <h1 class="h1 display-1">${message}</h1>
      <div class="text-center">
        <button class="btn btn-primary btn-lg mt-5 btn-transition" id="backToHomepage">Back to Homepage</button>
      </div>
    </header>
  `;

  document.getElementById("backToHomepage").addEventListener("click", function() {
    window.location.href = 'login.html';
  });
}
