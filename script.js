const dateElement = document.querySelector("#current-date");
const recordButton = document.querySelector("#record-button");

const today = new Intl.DateTimeFormat("en-US", {
  weekday: "long",
  year: "numeric",
  month: "long",
  day: "numeric"
}).format(new Date());

dateElement.textContent = today;

recordButton.addEventListener("click", () => {
  window.alert(
    "The issue-recording system will be added in the next stage."
  );
});
