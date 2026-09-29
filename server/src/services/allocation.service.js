const { pool } = require('../config/db');

async function runAllocation() {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    // Clear existing allocations
    await client.query('DELETE FROM allocations');

    // Get the maximum rank any student has assigned
    const maxRankResult = await client.query('SELECT COALESCE(MAX(rank), 0) as max_rank FROM rankings');
    const maxRank = maxRankResult.rows[0].max_rank;

    if (maxRank === 0) {
      await client.query('COMMIT');
      return [];
    }

    // ---- Phase 1: Primary Allocation ----
    for (let rank = 1; rank <= maxRank; rank++) {
      // Get all students who have a ranking at this rank and are not yet allocated
      const studentsAtRank = await client.query(
        `SELECT r.pgpid, r.committee_login
         FROM rankings r
         WHERE r.rank = $1
           AND NOT EXISTS (
             SELECT 1 FROM allocations al WHERE al.pgpid = r.pgpid
           )`,
        [rank]
      );

      for (const row of studentsAtRank.rows) {
        const { pgpid, committee_login } = row;

        // Check the committee's decision on this student
        const appResult = await client.query(
          `SELECT committee_rank FROM applications
           WHERE pgpid = $1 AND committee_login = $2 AND is_active = true`,
          [pgpid, committee_login]
        );

        if (appResult.rows.length === 0) continue;

        const committeeRank = appResult.rows[0].committee_rank;

        if (committeeRank === 0) {
          // Selected: allocate directly
          await client.query(
            `INSERT INTO allocations (pgpid, committee_login, student_rank, committee_rank, is_waitlist)
             VALUES ($1, $2, $3, $4, false)`,
            [pgpid, committee_login, rank, 0]
          );
        } else if (committeeRank > 0) {
          // Waitlisted: allocate as waitlist
          await client.query(
            `INSERT INTO allocations (pgpid, committee_login, student_rank, committee_rank, is_waitlist)
             VALUES ($1, $2, $3, $4, true)`,
            [pgpid, committee_login, rank, committeeRank]
          );
        }
        // committeeRank === -1 means rejected or not reviewed, skip
      }
    }

    // ---- Phase 2: Waitlist Resolution ----
    const waitlistedStudents = await client.query(
      `SELECT al.pgpid, al.committee_login, al.student_rank
       FROM allocations al
       WHERE al.is_waitlist = true
       ORDER BY al.student_rank`
    );

    for (const wl of waitlistedStudents.rows) {
      const { pgpid } = wl;
      let currentCommittee = wl.committee_login;
      let currentStudentRank = wl.student_rank;

      // Get all rankings for this student beyond their current rank
      const studentRankings = await client.query(
        `SELECT committee_login, rank
         FROM rankings
         WHERE pgpid = $1 AND rank > $2
         ORDER BY rank`,
        [pgpid, currentStudentRank]
      );

      for (const nextRanking of studentRankings.rows) {
        // Check if current committee is full
        // seatsSelected = count of applications where committee_rank = 0 for currentCommittee
        const seatsSelectedResult = await client.query(
          `SELECT COUNT(*) as cnt FROM applications
           WHERE committee_login = $1 AND committee_rank = 0 AND is_active = true`,
          [currentCommittee]
        );
        const seatsSelected = parseInt(seatsSelectedResult.rows[0].cnt, 10);

        // seatsAllocated = count of allocations where is_waitlist = false for currentCommittee
        const seatsAllocatedResult = await client.query(
          `SELECT COUNT(*) as cnt FROM allocations
           WHERE committee_login = $1 AND is_waitlist = false`,
          [currentCommittee]
        );
        const seatsAllocated = parseInt(seatsAllocatedResult.rows[0].cnt, 10);

        if (seatsAllocated < seatsSelected) {
          // Committee not full, student stays on waitlist here
          break;
        }

        // Committee is full, try next committee
        const nextCommittee = nextRanking.committee_login;
        const nextRank = nextRanking.rank;

        const nextAppResult = await client.query(
          `SELECT committee_rank FROM applications
           WHERE pgpid = $1 AND committee_login = $2 AND is_active = true`,
          [pgpid, nextCommittee]
        );

        if (nextAppResult.rows.length === 0) continue;

        const nextCommitteeRank = nextAppResult.rows[0].committee_rank;

        if (nextCommitteeRank === 0) {
          // Selected at next committee, move there
          await client.query(
            `UPDATE allocations
             SET committee_login = $1, student_rank = $2, committee_rank = 0, is_waitlist = false
             WHERE pgpid = $3`,
            [nextCommittee, nextRank, pgpid]
          );
          break; // Student is now allocated
        } else if (nextCommitteeRank > 0) {
          // Waitlisted at next committee, move there and continue
          await client.query(
            `UPDATE allocations
             SET committee_login = $1, student_rank = $2, committee_rank = $3, is_waitlist = true
             WHERE pgpid = $4`,
            [nextCommittee, nextRank, nextCommitteeRank, pgpid]
          );
          currentCommittee = nextCommittee;
          currentStudentRank = nextRank;
          // Continue checking next rankings
        }
        // nextCommitteeRank === -1 means rejected, skip to next
      }
    }

    // Fetch final results
    const results = await client.query(
      `SELECT al.*, u.name as student_name, u.batch,
              c.name as committee_name, c.type as committee_type
       FROM allocations al
       JOIN users u ON al.pgpid = u.pgpid
       JOIN committees c ON al.committee_login = c.login
       ORDER BY c.name, al.student_rank`
    );

    await client.query('COMMIT');
    return results.rows;
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
}

module.exports = { runAllocation };
