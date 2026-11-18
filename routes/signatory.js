const express = require("express");
const router = express.Router();
const Signatory = require("../models/signatory");
const wrapAsync = require("../utils/wrapAsync");

const DEFAULT_AUTHORITIES = [
  {
    key: "director",
    designation: "OS",
    name: "",
  },
  {
    key: "associateDirector",
    designation: "Sc 'G'",
    name: "",
  },
  {
    key: "courseDirector",
    designation: "Sc 'E'",
    name: "",
  },
  {
    key: "courseCoordinator",
    designation: "Sc 'C'",
    name: "",
  },
  {
    key: "deputyCourseCoordinator",
    designation: "TO 'C'",
    name: "",
  },
  {
    key: "sub",
    designation: "SUB",
    name: "",
  },
  {
    key: "nbSub",
    designation: "Nb SUB",
    name: "",
  },
];

const FIXED_KEYS = DEFAULT_AUTHORITIES.map((authority) => authority.key);

// get current saved authorities
router.get(
  "/",
  wrapAsync(async (req, res) => {
    let signDoc = await Signatory.findOne();
    if (!signDoc) {
      signDoc = await Signatory.create({
        authorities: DEFAULT_AUTHORITIES,
      });
    } else {
      const existingKeys = signDoc.authorities.map((a) => a.key);
      const newAuthorities = DEFAULT_AUTHORITIES.filter(
        (a) => !existingKeys.includes(a.key),
      );
      if (newAuthorities.length > 0) {
        signDoc.authorities.push(...newAuthorities);
        await signDoc.save();
      }
    }
    res.render("signatory/show.ejs", { signDoc });
  }),
);

// update the name and designation of an authority
router.put(
  "/",
  wrapAsync(async (req, res) => {
    const { authorities } = req.body;

    if (!Array.isArray(authorities)) {
      return res.status(400).json({
        message: "Invalid authorities data",
      });
    }

    if (authorities.length !== FIXED_KEYS.length) {
      return res.status(400).json({
        message: "Invalid number of authorities",
      });
    }

    const updatedAuthorities = authorities.map((authority) => {
      if (!FIXED_KEYS.includes(authority.key)) {
        throw new Error(`Invalid authority key: ${authority.key}`);
      }

      return {
        key: authority.key,
        designation: String(authority.designation || "").trim(),
        name: String(authority.name || "").trim(),
      };
    });

    const signDoc = await Signatory.findOneAndUpdate(
      {},
      {
        authorities: updatedAuthorities,
      },
      {
        new: true,
        upsert: true,
        runValidators: true,
      },
    );

    res.status(200).json({
      message: "Authorities updated successfully",
      signDoc,
    });
  }),
);

module.exports = router;
