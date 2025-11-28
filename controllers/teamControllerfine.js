import SupportTicket from "../models/SupportTicket.model.js";
import Referral from "../models/Referral.model.js";
import bcrypt from "bcryptjs";
const { hash, compare } = bcrypt;

// Get tickets assigned to technician
export const getAssignedTickets = async (req, res) => {
  try {
    const technicianId = req.user._id;

    const tickets = await SupportTicket.find({ technician: technicianId })
      .populate("setupBox customer")
      .sort({ createdAt: -1 });

    res.status(200).json(tickets);
  } catch (error) {
    console.error("Error fetching assigned tickets:", error);
    res.status(500).json({ message: "Failed to get assigned tickets", error });
  }
};

// Mark ticket as resolved
export const resolveTicket = async (req, res) => {
  try {
    const { ticketId } = req.params;
    const technicianId = req.user._id;

    const ticket = await SupportTicket.findOne({
      _id: ticketId,
      technician: technicianId,
    });
    if (!ticket) {
      return res
        .status(404)
        .json({ message: "Ticket not found or not assigned to you" });
    }

    ticket.status = "resolved";
    ticket.resolvedAt = new Date();
    await ticket.save();

    res.status(200).json({ message: "Ticket marked as resolved", ticket });
  } catch (error) {
    console.error("Error resolving ticket:", error);
    res.status(500).json({ message: "Failed to resolve ticket", error });
  }
};

// Escalate ticket to another technician/team
export const escalateTicket = async (req, res) => {
  try {
    const { ticketId } = req.params;
    const { newTechnicianId } = req.body;
    const technicianId = req.user._id;

    const ticket = await SupportTicket.findOne({
      _id: ticketId,
      technician: technicianId,
    });
    if (!ticket) {
      return res
        .status(404)
        .json({ message: "Ticket not found or not assigned to you" });
    }

    ticket.technician = newTechnicianId;
    ticket.status = "escalated";
    await ticket.save();

    res.status(200).json({ message: "Ticket escalated", ticket });
  } catch (error) {
    console.error("Error escalating ticket:", error);
    res.status(500).json({ message: "Failed to escalate ticket", error });
  }
};

// Create new ticket (during installation or service)
export const createTicket = async (req, res) => {
  try {
    const technicianId = req.user._id;
    const { setupBoxId, issueType, description, priority } = req.body;

    const ticket = await SupportTicket.create({
      technician: technicianId,
      setupBox: setupBoxId,
      issueType,
      description,
      priority,
      status: "pending",
    });

    res.status(201).json({ message: "Ticket created successfully", ticket });
  } catch (error) {
    console.error("Error creating ticket:", error);
    res.status(500).json({ message: "Failed to create ticket", error });
  }
};

// Get leads created by technician
export const getLeads = async (req, res) => {
  try {
    const technicianId = req.user._id;

    const leads = await Referral.find({ referrer: technicianId }).sort({
      createdAt: -1,
    });

    res.status(200).json(leads);
  } catch (error) {
    console.error("Error fetching leads:", error);
    res.status(500).json({ message: "Failed to get leads", error });
  }
};

// Create a lead (referral)
export const createLead = async (req, res) => {
  try {
    const technicianId = req.user._id;
    const { referredPhone, referralCode } = req.body;

    // Avoid duplicates if needed here

    const lead = await Referral.create({
      referrer: technicianId,
      referredPhone,
      referralCode,
      status: "pending",
    });

    res.status(201).json({ message: "Lead created", lead });
  } catch (error) {
    console.error("Error creating lead:", error);
    res.status(500).json({ message: "Failed to create lead", error });
  }
};

import Team from "../models/Team.model.js";
// import { hash } from "bcryptjs";

// ✅ Create new team member
export const createTeamMember = async (req, res) => {
  try {
    const { firstName, lastName, email, password, region, role } = req.body;

    const emailExists = await Team.findOne({ email });
    if (emailExists) {
      return res.status(400).json({ error: "Email already exists" });
    }

    const newMember = new Team({
      firstName,
      lastName,
      email,
      password,
      region,
      role,
    });

    await newMember.save();

    res.status(201).json({
      message: "Team member created",
      member: { ...newMember.toObject(), password: undefined },
    });
  } catch (error) {
    console.error("Error creating team member:", error);
    res.status(500).json({ message: "Server Error", error: error.message });
  }
};

// ✅ Get all team members (admin view)
export const getAllTeamMembers = async (req, res) => {
  try {
    const members = await Team.find().select("-password");
    res.status(200).json(members);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// ✅ Get single team member by ID
export const getTeamMemberById = async (req, res) => {
  try {
    const member = await Team.findById(req.params.id).select("-password");
    if (!member) return res.status(404).json({ message: "Not found" });
    res.status(200).json(member);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// ✅ Update team member (admin, allow password update)
export const updateTeamMember = async (req, res) => {
  try {
    const { id } = req.params;
    const updates = { ...req.body };

    if (updates.password) {
      updates.password = await hash(updates.password, 12);
    }

    const updated = await Team.findByIdAndUpdate(id, updates, {
      new: true,
    }).select("-password");
    if (!updated)
      return res.status(404).json({ message: "Team member not found" });

    res.status(200).json({ message: "Updated successfully", team: updated });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// ✅ Delete team member
export const deleteTeamMember = async (req, res) => {
  try {
    const { id } = req.params;
    const deleted = await Team.findByIdAndDelete(id);
    if (!deleted) return res.status(404).json({ message: "Not found" });
    res.status(200).json({ message: "Team member deleted" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const adminUpdateTeamMemberPassword = async (req, res) => {
  try {
    const { newPassword } = req.body;
    if (!newPassword)
      return res.status(400).json({ error: "New password required" });

    const hashed = await hash(newPassword, 12);
    const updated = await Team.findByIdAndUpdate(req.params.id, {
      password: hashed,
    });

    if (!updated)
      return res.status(404).json({ message: "Team member not found" });

    res.status(200).json({ message: "Password updated" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
