'use strict'


/**
 * Modules
 * Node
 * @constant
 */
const fs = require('fs-extra')
const os = require('os')
const path = require('path')

/**
 * Modules
 * Electron
 * @constant
 */
const electron = require('electron')
const { app, dialog } = electron || electron.remote

/**
 * Modules
 * External
 * @constant
 */
const logger = require('@bengennaria/logger')({ write: true })
const platformTools = require('@bengennaria/platform-tools')


/**
 * Application
 * @constant
 * @default
 */
const appProductName = app.name


/**
 * Wrapper for dialog.showMessageBox
 *
 * @param {String} title - Title
 * @param {String} message - Message
 * @param {Array} buttonList - Buttons
 * @param {String} type - Type
 * @param {function(*)} callback - Callback
 *
 * @private
 */
let createMessageDialog = (title = appProductName, message = title, buttonList = [ 'Dismiss' ], type = 'info', callback = () => {}) => {
    logger.debug('createMessageDialog', 'title:', title, 'message:', message, 'buttonList:', buttonList, 'type:', type)

    // Show message box dialog
    dialog.showMessageBox({
        type: type,
        title: title,
        message: title,
        detail: message,
        buttons: buttonList,
        cancelId: 0,
        defaultId: 0
    }).then((result) => {
        // Handle Result
        logger.debug('createMessageDialog', 'result:', result)

        // Callback
        callback(null, result)
    }).catch((error) => {
        // Handle Error
        logger.error('createMessageDialog', error)

        // Callback
        callback(error)
    })
}


/**
 * Check if a file exists at a given path
 *
 * @param {String} filePath - Path to file
 * @param {function(*)} callback - Callback
 *
 * @private
 */
let checkFileExists = (filePath, callback = () => {}) => {
    logger.debug('checkFileExists')

    // Check if file exists
    fs.access(filePath, fs.constants.F_OK, (error) => {
        // Handle inaccessible file
        if (error) {
            logger.error('checkFileExists', error)

            // Callback
            callback(error)
            return
        }

        // Callback
        callback(null)
    })
}


/**
 * Show informational dialog (Buttons: Dismiss)
 *
 * @param {String=} title - Title
 * @param {String=} message - Message
 * @param {function(*)} callback - Callback
 *
 * @public
 */
let showInformation = (title, message, callback = () => {}) => {
    logger.debug('showInformation')

    // Show dialog
    createMessageDialog(title, message, [ 'Dismiss' ], 'info', callback)
}

/**
 * Show warning dialog (Buttons: Dismiss)
 *
 * @param {String=} message - Message
 * @param {function(*)} callback - Callback
 *
 * @public
 */
let showWarning = (message, callback = () => {}) => {
    logger.debug('showWarning')

    // Show dialog
    createMessageDialog('Warning', message, [ 'Dismiss' ], 'warning', callback)
}

/**
 * Show confirmation dialog (Buttons: No, Yes)
 *
 * @param {String=} title - Title
 * @param {String=} message - Message
 * @param {function(*)} callback - Callback
 *
 * @public
 */
let showConfirmation = (title, message, callback = () => {}) => {
    logger.debug('showConfirmation')

    // Focus app
    app.focus()

    // Show dialog
    createMessageDialog(title, message, [ 'No', 'Yes' ], 'question', callback)
}

/**
 * Show error message dialog (Buttons: Dismiss, Restart, Quit)
 *
 * @param {String=} message - Message
 * @param {function(*)} callback - Callback
 *
 * @public
 */
let showError = (message, callback = () => {}) => {
    logger.debug('showError')

    // Bounce app icon (macOS)
    if (platformTools.isMacOS) {
        app.dock.bounce('critical')
    }

    // Focus app
    app.focus()

    // Show dialog
    createMessageDialog('Error', message, [ 'Dismiss', 'Restart', 'Quit' ], 'error', (error, result) => {
        // Handle Error
        if (error) {
            logger.error('showError', error)

            // Callback
            callback(error)
            return
        }

        // Handle Result
        if (result.response === 1) {
            // Restart
            app.relaunch()
            app.quit()
        } else if (result.response === 2) {
            // Quit
            app.quit()
        }

        // Callback
        callback(null, result)
    })
}


/**
 * Show file opening Dialog
 *
 * @param {String=} dialogTitle - Title
 * @param {Array=} fileExtensionList - Accepted file extensions
 * @param {String=} initialFolder - Initial lookup folder
 * @param {function(*)} callback - Callback
 *
 * @public
 */
let openFile = (dialogTitle = appProductName, fileExtensionList = [ '*' ], initialFolder = app.getPath(name), callback = () => {}) => {
    logger.debug('openFile')

    // Show file opening dialog

    // noinspection JSCheckFunctionSignatures
    dialog.showOpenDialog({
        title: dialogTitle,
        properties: [ 'openFile', 'showHiddenFiles', 'treatPackageAsDirectory' ],
        defaultPath: initialFolder,
        filters: [ { name: 'Filter', extensions: fileExtensionList } ]
    }).then((result) => {
        // Handle Result
        const filePathList = result.filePaths

        // Test for empty selection
        if (filePathList.length === 0) {
            logger.warn('openFile', 'file selection empty')

            // Callback
            callback(new Error('file selection empty'))
            return
        }

        // Normalize path
        const filePath = path.normalize(filePathList[0])

        // Test for missing file
        checkFileExists(filePath, (error) => {
            // Handle missing file
            if (error) {
                logger.warn('openFile', 'checkFileExists', error)

                // Show warning dialog
                // Callback
                showWarning(`File not found.${os.EOL}`, () => callback(error))
                return
            }

            // Callback
            callback(null, filePath)
        })
    }).catch((error) => {
        // Handle Error
        logger.error('openFile', error)

        // Callback
        callback(error)
    })
}


/**
 * @exports
 */
module.exports = {
    openFile: openFile,
    showError: showError,
    showInformation: showInformation,
    showWarning: showWarning,
    showConfirmation: showConfirmation
}
