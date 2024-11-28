// Service.js
const repository = require("../../repository/repository");
const Event = require("../../model/event/event.model");
const checkEventOwnership = require("../../middleware/checkEventOwnership");
const Participant = require("../../model/participants/participants.model");

const checkUsername = async (data, managerId) => {
  const event = await Event.findById(data.event);

  if (!event) {
    throw new Error("Event not found for the specified ID");
  }

  checkEventOwnership(managerId, event.organisateur);

  const usernameExists = await Participant.findOne({
    username: data.username,
    event: data.event,
  });

  const phoneExists = await Participant.findOne({
    phone: data.phone,
    event: data.event,
  });

  const emailExists = await Participant.findOne({
    email: data.email,
    event: data.event,
  });

  if (usernameExists) {
    throw new Error("Username is already taken for this event");
  }
  if (emailExists) {
    throw new Error("email is already taken for this event");
  }

  if (phoneExists) {
    throw new Error("phone is already taken for this event");
  }

  const newParticipantData = {
    data,
    event,
  };

  return newParticipantData;
};

const getAllParticipants = async (
  model,
  page,
  limit,
  filter,
  populate,
  selectFields
) => {
  return await repository.getData(
    model,
    page,
    limit,
    filter,
    populate,
    selectFields
  );
};

const getParticipantsById = async (model, id, populate, selectFields) => {
  return await repository.getDataById(model, id, populate, selectFields);
};

const createParticipants = async (model, data, mangerId) => {
  const dataEvent = await checkUsername(data, mangerId);
  if (dataEvent.event.participants <= 0) {
    throw new Error("No more participants allowed for this event");
  }

  dataEvent.event.participants -= 1;

  await dataEvent.event.save();

  return await repository.createData(model, dataEvent.data);
};

const updateParticipants = async (model, id, data, managerId) => {
  const participant = await Participant.findById(id);
  if (!participant) {
    throw new Error("Participant not found for the specified ID");
  }
  data.event = participant.event;
  await checkUsername(data, managerId);
  const updateparticipant = {
    username: data.username,
    email: data.email,
    phone: data.phone,
  };
  return await repository.updateData(model, id, updateparticipant);
};

const deleteParticipants = async (model, id, managerId) => {
  const participant = await Participant.findById(id);
  if (!participant) {
    throw new Error("Participant not found for the specified ID");
  }
  const event = await Event.findById(participant.event);

  if (!event) {
    throw new Error("Event not found for the specified ID");
  }

  checkEventOwnership(managerId, event.organisateur);

  event.participants += 1;

  await event.save();

  return await repository.deleteData(model, id);
};

module.exports = {
  getAllParticipants,
  getParticipantsById,
  createParticipants,
  updateParticipants,
  deleteParticipants,
};
