"use client";

export default function PowerHourAlertTestButton() {
  function testFullAlert() {
    window.dispatchEvent(
      new Event(
        "hive:power-hour-test",
      ),
    );
  }

  return (
    <button
      type="button"
      onClick={
        testFullAlert
      }
      className="test-button"
    >
      ⚡ Test Full Power Hour Alert
    </button>
  );
}
