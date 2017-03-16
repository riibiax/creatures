var express = require('express');
var socket = require('socket.io');
var firebase = require('firebase');
var exec = require('child_process').exec;
var fs = require('fs');
var config= require('./config');
var utils = require ('./utilsNode');
