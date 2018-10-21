/*==============================================================================
Programmer Sound Example
Copyright (c), Firelight Technologies Pty, Ltd 2012-2018.

This example demonstrates how to implement the programmer sound callback to
play an event that has a programmer specified sound.

### See Also ###
Studio::EventInstance::setCallback
==============================================================================*/

//==============================================================================
// Prerequisite code needed to set up FMOD object.  See documentation.
//==============================================================================

var FMOD = {};                          // FMOD global object which must be declared to enable 'main' and 'preRun' and then call the constructor function.
FMOD['preRun'] = prerun;                // Will be called before FMOD runs, but after the Emscripten runtime has initialized
FMOD['onRuntimeInitialized'] = main;    // Called when the Emscripten runtime has initialized
FMOD['TOTAL_MEMORY'] = 64*1024*1024;    // FMOD Heap defaults to 16mb which is enough for this demo, but set it differently here for demonstration (64mb)
FMODModule(FMOD);                       // Calling the constructor function with our object

//==============================================================================
// Example code
//==============================================================================

var gSystem;                            // Global 'System' object which has the Studio API functions.
var gSystemLowLevel;                    // Global 'SystemLowLevel' object which has the Low Level API functions.
var gEventInstance = {};                // Global Event Instance for the cancel event.
var programmerSoundContext = 
{
    system:gSystemLowLevel,
    soundName:"",
    subSound:0
};
var gAudioResumed  = false;             // Boolean to avoid resetting FMOD on IOS/Chrome every time screen is touched.

// Simple error checking function for all FMOD return values.
function CHECK_RESULT(result)
{
    if (result != FMOD.OK)
    {
        var msg = "Error!!! '" + FMOD.ErrorString(result) + "'";

        alert(msg);

        throw msg;
    }
}

// Will be called before FMOD runs, but after the Emscripten runtime has initialized
// Call FMOD file preloading functions here to mount local files.  Otherwise load custom data from memory or use own file system. 
function prerun() 
{
    var fileUrl = "/public/js/";
    var fileName;
    var folderName = "/";
    var canRead = true;
    var canWrite = false;

    fileName = [
        "programmer_sound.fsb",
        "Master Bank.bank",
        "Master Bank.strings.bank",
        "SFX.bank"
    ];

    for (var count = 0; count < fileName.length; count++)
    {
        document.querySelector("#display_out2").value = "Loading " + fileName[count] + "...";

        FMOD.FS_createPreloadedFile(folderName, fileName[count], fileUrl + fileName[count], canRead, canWrite);
    }
}

// Called when the Emscripten runtime has initialized
function main()
{
    // A temporary empty object to hold our system
    var outval = {};
    var result;

    console.log("Creating FMOD System object\n");

    // Create the system and check the result
    result = FMOD.Studio_System_Create(outval);
    CHECK_RESULT(result);

    console.log("grabbing system object from temporary and storing it\n");

    // Take out our System object
    gSystem = outval.val;

    result = gSystem.getLowLevelSystem(outval);
    CHECK_RESULT(result);

    gSystemLowLevel = outval.val;
    
    // Optional.  Setting DSP Buffer size can affect latency and stability.
    // Processing is currently done in the main thread so anything lower than 2048 samples can cause stuttering on some devices.
    console.log("set DSP Buffer size.\n");
    result = gSystemLowLevel.setDSPBufferSize(2048, 2);
    CHECK_RESULT(result);
    
    // Optional.  Set sample rate of mixer to be the same as the OS output rate.
    // This can save CPU time and latency by avoiding the automatic insertion of a resampler at the output stage.
    // console.log("Set mixer sample rate");
    // result = gSystemLowLevel.getDriverInfo(0, null, null, outval, null, null);
    // CHECK_RESULT(result);
    // result = gSystemLowLevel.setSoftwareFormat(outval.val, FMOD.SPEAKERMODE_DEFAULT, 0)
    // CHECK_RESULT(result);

    console.log("initialize FMOD\n");

    // 1024 virtual channels
    result = gSystem.initialize(1024, FMOD.STUDIO_INIT_NORMAL, FMOD.INIT_NORMAL, null);
    CHECK_RESULT(result);

    // Starting up your typical JavaScript application loop
    console.log("initialize Application\n");

    initApplication();

    // Set up iOS/Chrome workaround.  Webaudio is not allowed to start unless screen is touched or button is clicked.
    function resumeAudio() 
    {
        if (!gAudioResumed)
        {
            console.log("Resetting audio driver based on user input.");

            result = gSystemLowLevel.mixerSuspend();
            CHECK_RESULT(result);
            result = gSystemLowLevel.mixerResume();
            CHECK_RESULT(result);

            gAudioResumed = true;
        }

    }

    var iOS = /iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream;
    if (iOS)
    {
        window.addEventListener('touchend', resumeAudio, false);
    }
    else
    {
        document.addEventListener('click', resumeAudio);
    }

    // Set the framerate to 50 frames per second, or 20ms.
    console.log("Start game loop\n");

    window.setInterval(updateApplication, 20);

    return FMOD.OK;
}

function programmerSoundCallback(type, eventInstance, parameters)
{   
    if (type == FMOD.STUDIO_EVENT_CALLBACK_CREATE_PROGRAMMER_SOUND)
    {
        console.log("STUDIO_EVENT_CALLBACK_CREATE_PROGRAMMER_SOUND");

        // Get our context from the event instance user data
        var outval = {};
        var context;
        var parentsound;

        CHECK_RESULT( eventInstance.getUserData(outval) );
        context = outval.val;

        console.log("Creating programmer sound ", context.soundName);
        console.log("Creating programmer sound, using sub sound ", context.subSound);

        // Create the sound.  This sound is an FSB.  FSB's consist of a 'parent sound' and children/sub sounds.
        CHECK_RESULT( context.system.createSound(context.soundName, FMOD.CREATECOMPRESSEDSAMPLE, null, outval) );
        parentsound = outval.val;
       
        // Pass the sound to FMOD.  Get a 'subsound' to pass back as the programmer sound.
        CHECK_RESULT( parentsound.getSubSound(context.subSound, outval) );
        parameters.sound = outval.val;
    }
    else if (type == FMOD.STUDIO_EVENT_CALLBACK_DESTROY_PROGRAMMER_SOUND)
    {
        console.log("STUDIO_EVENT_CALLBACK_DESTROY_PROGRAMMER_SOUND");

        // Obtain the sound
        var outval = {};
        var sound = parameters.sound;
        var parentsound;

        // We dont want to release a subsound, we want to release the 'parent' sound.  Releasing a subsound will not free the memory correctly.
        sound.getSubSoundParent(outval);
        parentsound = outval.val;

        // Release the sound
        CHECK_RESULT( parentsound.release() );
    }

    return FMOD.OK;
}

// Function called when user presses HTML Play Sound button, with parameter 0, 1 or 2.
function playEvent(soundid)
{
    if (soundid == "0")
    {
        programmerSoundContext.soundName = "/programmer_sound.fsb";
        programmerSoundContext.subSound = 0;
        CHECK_RESULT( gEventInstance.start() );
    }
    else if (soundid == "1")
    {
        programmerSoundContext.soundName = "/programmer_sound.fsb";
        programmerSoundContext.subSound = 1;
        CHECK_RESULT( gEventInstance.start() );
    }
    else if (soundid == "2")
    {
        programmerSoundContext.soundName = "/programmer_sound.fsb";
        programmerSoundContext.subSound = 2;
        CHECK_RESULT( gEventInstance.start() );
    }
    else if (soundid == "3")
    {
        programmerSoundContext.soundName = "/programmer_sound.fsb";
        programmerSoundContext.subSound = 3;
        CHECK_RESULT( gEventInstance.start() );
    }
}

// Helper function to load a bank by name.
function loadBank(name)
{
    var bankhandle = {};
    CHECK_RESULT( gSystem.loadBankFile("/" + name, FMOD.STUDIO_LOAD_BANK_NORMAL, bankhandle) );
}

// Called from main, does some application setup.  In our case we will load some sounds.
function initApplication() 
{
    var outval = {};
    console.log("Loading events\n");

    loadBank("Master Bank.bank");
    loadBank("Master Bank.strings.bank");
    loadBank("SFX.bank");
    
    // Get the Looping Ambience event
    var eventDescription = {};
    CHECK_RESULT( gSystem.getEvent("event:/Character/Radio Dialogue", outval) );
    eventDescription = outval.val;
    
    CHECK_RESULT( eventDescription.createInstance(outval) );
    gEventInstance = outval.val;

    // Fill our context struct with the low level system handle.
    CHECK_RESULT( gSystem.getLowLevelSystem(outval) );
    programmerSoundContext.system = outval.val;

    // set the context as a user property of the event instance, and set up the callback
    CHECK_RESULT( gEventInstance.setUserData(programmerSoundContext) );
    CHECK_RESULT( gEventInstance.setCallback(programmerSoundCallback, FMOD.STUDIO_EVENT_CALLBACK_CREATE_PROGRAMMER_SOUND | FMOD.STUDIO_EVENT_CALLBACK_DESTROY_PROGRAMMER_SOUND) );
    CHECK_RESULT( gEventInstance.setVolume(0.75) );

    // Once the loading is finished, re-enable the disabled buttons.
    document.getElementById("playEvent0").disabled = false;     
    document.getElementById("playEvent1").disabled = false;     
    document.getElementById("playEvent2").disabled = false;     
    document.getElementById("playEvent3").disabled = false;     
}

// Called from main, on an interval that updates at a regular rate (like in a game loop).
// Prints out information, about the system, and importantly calles System::udpate().
function updateApplication() 
{
    var dsp = {};
    var stream = {};
    var update = {};
    var total = {};
    var result;
    
    result = gSystemLowLevel.getCPUUsage(dsp, stream, null, update, total);
    CHECK_RESULT(result);

    var channelsplaying = {};
    result = gSystemLowLevel.getChannelsPlaying(channelsplaying, null);
    CHECK_RESULT(result);

    document.querySelector("#display_out").value = "Channels Playing = " + channelsplaying.val + 
                                                   " : CPU = dsp " + dsp.val.toFixed(2) + 
                                                   "% stream " + stream.val.toFixed(2) + 
                                                   "% update " + update.val.toFixed(2) + 
                                                   "% total " + total.val.toFixed(2) + 
                                                   "%";
    var numbuffers = {};
    var buffersize = {};
    result = gSystemLowLevel.getDSPBufferSize(buffersize, numbuffers);
    CHECK_RESULT(result) 

    var rate = {};
    result = gSystemLowLevel.getSoftwareFormat(rate, null, null);
    CHECK_RESULT(result);

    var sysrate = {};
    result = gSystemLowLevel.getDriverInfo(0, null, null, sysrate, null, null);
    CHECK_RESULT(result);
    
    var ms = numbuffers.val * buffersize.val * 1000 / rate.val;
    document.querySelector("#display_out2").value = "Mixer rate = " + rate.val + "hz : System rate = " + sysrate.val + "hz : DSP buffer size = " + numbuffers.val + " buffers of " + buffersize.val + " samples (" + ms.toFixed(2) + " ms)";

    // Update FMOD
    result = gSystem.update();
    CHECK_RESULT(result);
}