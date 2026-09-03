import { saveEmploymentProfile } from "./actions";

export default function EmploymentProfileForm({
  collectorId,
  profile,
}: {
  collectorId: number;
  profile:
    | {
        employmentType: string;
        schedulePattern: string;
        minPaidWeeklyHours: number;
        maxPaidWeeklyHours: number;
        targetPaidWeeklyHours: number;
        scheduledShiftHours: number;
        unpaidLunchMinutes: number;
      }
    | null;
}) {
  const employmentType = profile?.employmentType ?? "FTE";
  const schedulePattern = profile?.schedulePattern ?? "STANDARD_8";

  return (
    <form action={saveEmploymentProfile} className="employment-form">
      <input type="hidden" name="collectorId" value={collectorId} />

      <div className="grid">
        <label>
          <span>Employment Type</span>
          <select name="employmentType" defaultValue={employmentType}>
            <option value="FTE">FTE</option>
            <option value="PTE">PTE</option>
          </select>
        </label>

        <label>
          <span>Schedule Pattern</span>
          <select name="schedulePattern" defaultValue={schedulePattern}>
            <option value="STANDARD_8">Standard 8-hour shifts</option>
            <option value="FOUR_TENS">4 × 10-hour shifts</option>
          </select>
        </label>

        <label>
          <span>Minimum Paid Hours</span>
          <input
            name="minPaidWeeklyHours"
            type="number"
            step="0.5"
            defaultValue={profile?.minPaidWeeklyHours ?? 37}
          />
        </label>

        <label>
          <span>Maximum Paid Hours</span>
          <input
            name="maxPaidWeeklyHours"
            type="number"
            step="0.5"
            defaultValue={profile?.maxPaidWeeklyHours ?? 40}
          />
        </label>

        <label>
          <span>Target Paid Hours</span>
          <input
            name="targetPaidWeeklyHours"
            type="number"
            step="0.5"
            defaultValue={profile?.targetPaidWeeklyHours ?? 40}
          />
        </label>

        <label>
          <span>Scheduled Shift Hours</span>
          <input
            name="scheduledShiftHours"
            type="number"
            step="0.5"
            defaultValue={profile?.scheduledShiftHours ?? 8}
          />
        </label>

        <label>
          <span>Unpaid Lunch Minutes</span>
          <input
            name="unpaidLunchMinutes"
            type="number"
            step="5"
            defaultValue={profile?.unpaidLunchMinutes ?? 30}
          />
        </label>
      </div>

      <button type="submit">Save Employment Profile</button>

      <style>{`
        .employment-form {
          margin-top: 14px;
          padding: 16px;
          border: 1px solid #e7d8a7;
          border-radius: 16px;
          background: #fffdf7;
        }
        .grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
          gap: 12px;
        }
        label span {
          display: block;
          margin-bottom: 5px;
          color: #6b6251;
          font-size: 11px;
          font-weight: 800;
          text-transform: uppercase;
        }
        input, select {
          width: 100%;
          padding: 9px 10px;
          border: 1px solid #ded3b7;
          border-radius: 9px;
          background: white;
        }
        button {
          margin-top: 14px;
          padding: 9px 12px;
          border: 0;
          border-radius: 10px;
          background: #3f2d09;
          color: white;
          font-weight: 800;
          cursor: pointer;
        }
      `}</style>
    </form>
  );
}
