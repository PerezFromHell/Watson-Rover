/**
 * Copyright 2015 IBM Corp. All Rights Reserved.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *      http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

/**
  node.js script for performing Watson Visual Recognition
  Receives zip file with 2 input landmark images
  Outputs "<city name 1>, left, <city name 2>, right"
  where city name 1 and 2 corresponds to cities associated with the landmark
*/

'use strict';

var express = require('express'),
  app = express(),
  watson = require('watson-developer-cloud'),
  extend = require('util')._extend,
  fs = require('fs');

// Bootstrap application settings
require('express')(app);

// Visual Recognition credentials
var credentials = extend({
  username: '<username>',
  password: '<password>',
  version: 'v1'
}); // VCAP_SERVICES

// Create the service wrapper
var visualRecognition = watson.visual_recognition(credentials);

// Open input zip file
var img = fs.createReadStream('./VR_watson.zip');

// Set classifier
var classifier = 'Landmark';
classifier = JSON.stringify({
  label_groups: [classifier]
});

// Prepare request form
var formData = {
  labels_to_check: classifier,
  image_file: img
};

// Invoke VR; parse result and write to stdout
visualRecognition.recognize(formData, function(err, result) {
  if (err) {
    // If error write -1 to output file
    console.log(err);
    fs.writeFileSync('vr_output.txt', output);
    process.exit(-1);
  } else {
    result = JSON.stringify(result);
    console.log(result);

    var res = result.match(/labels/g);
    if (res.length < 2) {
      console.log(res.length);
      fs.writeFileSync('./vr_output.txt', output);
      console.log('image parsing failed');
      process.exit(-2);
    }
    var parsed = JSON.parse(result);
    var nextvar = parsed.images;
    var numimages = nextvar.length;
    if (numimages > 2) {
      console.log('Received output for more than 2 images; Processing only first two');
    }
    var labels = '';
    var numlabels = 0;
    var imageid = 0;
    var imagelabelname = '';
    var i = 0,
      j = 0;
    var output = '';
    var city = '';
    var dir = ['left', 'right'];

    console.log(numimages);
    for (i = 0; i < 2; i++) {
      imageid = nextvar[i].image_id;
      console.log('image id = ');
      console.log(imageid);
      labels = nextvar[i].labels;
      numlabels = labels.length;
      console.log('number of labels = ');
      console.log(numlabels);
      city = 'unknown';
      for (j = 0; j < numlabels; j++) {
        imagelabelname = nextvar[i].labels[j].label_name;
        console.log(imagelabelname);
        imagelabelname = imagelabelname.toLowerCase();
        if ((imagelabelname.indexOf('eiffel')) !== -1)
          city = 'paris';
        else if ((imagelabelname.indexOf('taj')) !== -1)
          city = 'delhi';
        else if ((imagelabelname.indexOf('liberty')) !== -1)
          city = 'nyork,';
      }
      if (i === 0) output = city + ',' + dir[i] + ',';
      else if (i === 1) output = output + city + ',' + dir[i];
      console.log(output);
    }
    fs.writeFileSync('vr_output.txt', output);
    process.exit(0);
  }
});