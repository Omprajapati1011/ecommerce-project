import pool from "../configs/db.js";

export const registerUser = (req, res) => {
  const { name, email, password } = req.body;

  try {
    pool.query(
      `insert into user_master (name,email,password,created_by) values (?,?,?,?)`,
      [name, email, password, 1],
      (err, result) => {
        if (result.affectedRows === 0) {
          return res.json({
            success: false,
            message: "User not created successfully",
          });
        }
        if (err) {
          console.log(err);
        }
      },
    );

    return res.json({
      success: true,
      message: "User created successfully",
    });
  } catch (err) {
    console.log(err);
    res.status(200).json({
      success: false,
      message: "Database Error",
    });
  }
};
