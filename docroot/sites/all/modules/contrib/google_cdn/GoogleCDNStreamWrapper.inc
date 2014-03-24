<?php

/**
 * @file
 *
 * Implement DrupalStreamWrapperInterface to provide a Google Cloud Store steamwrapper.
 *
 */

class GoogleCDNStreamWrapper implements DrupalStreamWrapperInterface {

  /**
   * @var Google Cloud Store connection object
   */
  protected $gcs = NULL;

  /**
   * @var Google Cloud Store client object
   */
  protected $client = NULL;

  /**
   * @var Google Cloud Store API domain.
   */
  protected $domain = GOOGLE_CDN_API_DOMAIN;

  /**
   * @var String Instance URI referenced as "gs://bucket/"
   */
  protected $uri;

  /**
   * @var string Google Cloud Storage client ID
   */
  protected $client_id;

  /**
   * @var string Google Cloud Storage service account name
   */
  protected $service_account_name;

  /**
   * @var string Google Cloud Store bucket name
   */
  protected $bucket;

  /**
   * @var string Google Cloud Store folder name
   */
  protected $folder;

  /**
   * @var string Google Cloud Store allowed extensions.
   */
  protected $extensions;

  /**
   * @var string Google Cloud Store allowed key.
   */
  protected $key;

  /**
   * @var string Google Cloud Store allowed key_file_path.
   */
  protected $key_file_path;

  /**
   * @var string Google Cloud Store allowed pem_file.
   */
  protected $pem_file;

  /**
   * @var string Google Cloud Store allowed pem_fid.
   */
  protected $pem_fid;

  /**
   * A buffer for reading/wrting.
   */
  protected $object = NULL;

  /**
   * @var int Current read/write position
   */
  protected $position = 0;

  /**
   * @var int Total size of the object
   */
  protected $objectSize = 0;

  /**
   * @var string buffer
   */
  protected $buffer = NULL;

  /**
   * @var boolean Whether $buffer is active as a write buffer
   */
  protected $bufferWrite = FALSE;

  /**
   * @var int Buffer length
   */
  protected $bufferLength = 0;

  /**
   * @var bool HTTPS flag
   */
  protected $https = FALSE;

  /**
   * Object constructor.
   */
  public function __construct() {
    if (isset($_SERVER['HTTPS']) && $_SERVER['HTTPS'] !== FALSE) {
      $this->https = TRUE;
    }

    $this->client_id = variable_get('google_cdn_client_id');
    $this->service_account_name = variable_get('google_cdn_service_account_name');
    $this->bucket = variable_get('google_cdn_bucket_name');
    $this->folder = variable_get('google_cdn_folder');
    $this->extensions = variable_get('google_cdn_extensions');
    $this->key = variable_get('google_cdn_public_key');
    $this->key_file_path = variable_get('google_cdn_public_key_file_path');
    $this->pem_file = variable_get('google_cdn_pem_file_path');
    $this->pem_fid = variable_get('google_cdn_pem_fid');
    $this->getGCS();
  }

  /**
   * Sets the stream resource URI.
   *
   * URIs are formatted as "gs://bucket/key"
   *
   * @return string
   *   Returns the current URI of the instance.
   */
  public function setUri($uri) {
    $this->uri = $uri;
  }

  /**
   * Returns the stream resource URI.
   *
   * URIs are formatted as "gs://bucket/key"
   *
   * @return string
   *   Returns the current URI of the instance.
   */
  public function getUri() {
    return $this->uri;
  }

  /**
   * Returns a web accessible URL for the resource.
   *
   * @return string
   *   Returns a string containing a web accessible URL for the resource.
   */
  public function getExternalUrl() {

    // Image styles support
    // Delivers the first request to an image from the private file system
    // otherwise it returns an external URL to an image that has not been
    // created yet.
    $path = explode('/', $this->getLocalPath());
    if ($path[0] === 'styles') {
      $target = $this->getTarget($this->uri);
      if ($target) {
        array_shift($path);
        return url('system/files/styles/' . implode('/', $path), array('absolute' => TRUE));
      }
    }

    $url = '';
    $local_path = $this->getLocalPath();
    if ($local_path) {
      try {
        $url = $this->generate_signed_url($local_path);
      }
      catch (Exception $e) {
        watchdog_exception('google_cdn', $e, 'GoogleCDNStreamWrapper::getExternalUrl');
      }
    }

    return $url;
  }

  /**
   * Determine a file's media type.
   *
   * Uses Drupal's mimetype mappings. Returns 'application/octet-stream' if
   * no match is found.
   *
   * @return string
   *   Returns a string representing the file's MIME type
   */
  public static function getMimeType($uri, $mapping = NULL) {
    // Load the default file map.
    if (!isset($mapping)) {
      include_once DRUPAL_ROOT . '/includes/file.mimetypes.inc';
      $mapping = file_mimetype_mapping();
    }

    $extension = '';
    $file_parts = explode('.', basename($uri));

    // Remove the first part: a full filename should not match an extension.
    array_shift($file_parts);

    // Iterate over the file parts, trying to find a match.
    // For my.awesome.image.jpeg, we try:
    // jpeg
    // image.jpeg, and
    // awesome.image.jpeg
    while ($additional_part = array_pop($file_parts)) {
      $extension = strtolower($additional_part . ($extension ? '.' . $extension : ''));
      if (isset($mapping['extensions'][$extension])) {
        return $mapping['mimetypes'][$mapping['extensions'][$extension]];
      }
    }

    return 'application/octet-stream';
  }

  /**
   * Changes permissions of the resource.
   *
   * This doesn't do anything for the moment so just returns TRUE;
   *
   * @param int $mode
   *   Integer value for the permissions. Consult PHP chmod() documentation
   *   for more information.
   *
   * @return bool
   *   Returns TRUE.
   */
  public function chmod($mode) {
    return TRUE;
  }

  /**
   * Returns canonical, absolute path of the resource.
   *
   * @return bool
   *   Returns FALSE as this wrapper does not provide an implementation.
   */
  public function realpath() {
    return $this->getLocalPath();
  }

  /**
   * Support for fopen(), file_get_contents(), file_put_contents() etc.
   *
   * @param string $uri
   *   A string containing the URI to the file to open.
   * @param string $mode
   *   The file mode ("r", "wb" etc.).
   * @param int $options
   *   A bit mask of STREAM_USE_PATH and STREAM_REPORT_ERRORS.
   * @param string $opened_path
   *   A string containing the path actually opened.
   *
   * @return bool
   *   Returns TRUE if file was opened successfully.
   *
   * @see http://php.net/manual/en/streamwrapper.stream-open.php
   */
  public function stream_open($uri, $mode, $options, &$opened_path) {
    $this->callConstructor();
    $this->uri = $uri;

    // If this stream is being opened for writing, clear the object buffer.
    // Return true as we'll create the object on fflush call.
    if (strpbrk($mode, 'wax')) {
      $this->clearBuffer();
      $this->bufferWrite = TRUE;
      return TRUE;
    }

    $target = $this->getTarget($this->uri);
    if ($target) {
      try {
        $response = $this->gcs->objects->get($this->bucket, $this->folder . '/' . $target);
        if ($response) {
          $this->clearBuffer();
          $this->bufferWrite = FALSE;
          $this->objectSize = $response['size'];
          return TRUE;
        }
      }
      catch (Exception $e) {
        watchdog_exception('google_cdn', $e, 'GoogleCDNStreamWrapper::stream_open');
      }
    }

    return FALSE;
  }

  /**
   * Support for fclose().
   *
   * Clears the object buffer and returns TRUE
   *
   * @return bool
   *   TRUE
   *
   * @see http://php.net/manual/en/streamwrapper.stream-close.php
   */
  public function stream_close() {
    $this->clearBuffer();
    return TRUE;
  }

  /**
   * Support for flock().
   *
   * @param string $operation
   *   One of the following:
   *   - LOCK_SH to acquire a shared lock (reader).
   *   - LOCK_EX to acquire an exclusive lock (writer).
   *   - LOCK_UN to release a lock (shared or exclusive).
   *   - LOCK_NB if you don't want flock() to block while locking (not
   *     supported on Windows).
   *
   * @return bool
   *   returns TRUE if lock was successful
   *
   * @see http://php.net/manual/en/streamwrapper.stream-lock.php
   */
  public function stream_lock($operation) {
    return FALSE;
  }

  /**
   * Support for fread(), file_get_contents() etc.
   *
   * @param int $count
   *   Maximum number of bytes to be read.
   *
   * @return string
   *   The string that was read, or FALSE in case of an error.
   *
   * @see http://php.net/manual/en/streamwrapper.stream-read.php
   */
  public function stream_read($count) {
    //if the data is empty, get the data from the object
    //this stores all the data in the $stream_data property, only request once
    if (!$this->object) {
      //if the object is empty, get the object from rackspace
      $target = $this->getTarget($this->uri);
      if ($target) {
        try {
          $response = $this->gcs->objects->get($this->bucket, $this->folder . '/' . $target);
          if ($response) {
            $download_url= 'https://' . $this->domain . '/' . $this->bucket . '/' . $this->folder . '/' . $target;
            $request = new Google_HttpRequest($download_url, 'GET');
            $httpRequest = $this->client->getIo()->authenticatedRequest($request);
            if ($httpRequest) {
              $this->object = $httpRequest->getResponseBody();
            }
          }
        }
        catch (Exception $e) {
          watchdog_exception('gooogle_cdn', $e, 'GoogleCDNStreamWrapper::strea_read');
        }
      }
    }
    $data = substr($this->object, $this->position, $count);
    $this->position += $count;
    return $data;
  }

  /**
   * Support for fwrite(), file_put_contents() etc.
   *
   * @param string $data
   *   The string to be written.
   *
   * @return int
   *   The number of bytes written.
   *
   * @see http://php.net/manual/en/streamwrapper.stream-write.php
   */
  public function stream_write($data) {
    $data_length = strlen($data);
    $this->buffer .= $data;
    $this->bufferLength += $data_length;
    $this->position += $data_length;

    return $data_length;
  }

  /**
   * Support for feof().
   *
   * @return bool
   *   TRUE if end-of-file has been reached.
   *
   * @see http://php.net/manual/en/streamwrapper.stream-eof.php
   */
  public function stream_eof() {
    if (!$this->uri) {
      return TRUE;
    }
    return ($this->position >= $this->objectSize);
  }

  /**
   * Support for fseek().
   *
   * @param int $offset
   *   The byte offset to got to.
   * @param string $whence
   *   SEEK_SET, SEEK_CUR, or SEEK_END.
   *
   * @return bool
   *   TRUE on success.
   *
   * @see http://php.net/manual/en/streamwrapper.stream-seek.php
   */
  public function stream_seek($offset, $whence) {
    switch ($whence) {
      case SEEK_CUR:
        // Set position to current location plus $offset.
        $new_position = $this->position + $offset;
        break;

      case SEEK_END:
        // Set position to eof plus $offset.
        $new_position = $this->objectSize + $offset;
        break;

      case SEEK_SET:
      default:
        // Set position equal to $offset.
        $new_position = $offset;
        break;
    }

    $ret = ($new_position >= 0 && $new_position <= $this->objectSize);
    if ($ret) {
      $this->position = $new_position;
    }
    return $ret;
  }

  /**
   * Support for fflush(). Flush current cached stream data to storage.
   *
   * @return bool
   *   TRUE if data was successfully stored (or there was no data to store).
   *
   * @see http://php.net/manual/en/streamwrapper.stream-flush.php
   */
  public function stream_flush() {
    if ($this->bufferWrite) {
      try {
        $local_path = $this->getLocalPath();
        //set the mimetype for the file and set the location of the file to be uploaded
        $postbody = array('mimeType' => GoogleCDNStreamWrapper::getMimeType($this->uri), 'data' => $this->buffer, 'mediaUpload' => TRUE);
        $gso = new Google_StorageObject();
        $gso->setName($this->folder . '/' .  $local_path);
        $response = $this->gcs->objects->insert($this->bucket, $gso ,$postbody);
        if ($response) {
          return TRUE;
        }
      }
      catch (Exception $e) {
        watchdog_exception('google_cdn', $e, 'GoogleCDNStreamWrapper::stream_flush');
      }
    }
    $this->clearBuffer();
    return FALSE;
  }

  /**
   * Support for ftell().
   *
   * @return int
   *   The current offset in bytes from the beginning of file.
   *
   * @see http://php.net/manual/en/streamwrapper.stream-tell.php
   */
  public function stream_tell() {
    return $this->position;
  }

  /**
   * Support for fstat().
   *
   * @return array
   *   An array with file status, or FALSE in case of an error - see fstat()
   *   for a description of this array.
   *
   * @see http://php.net/manual/en/streamwrapper.stream-stat.php
   */
  public function stream_stat() {
    return $this->_stat();
  }

  /**
   * Support for unlink().
   *
   * @param string $uri
   *   A string containing the uri to the resource to delete.
   *
   * @return bool
   *   TRUE if resource was successfully deleted.
   *
   * @see http://php.net/manual/en/streamwrapper.unlink.php
   */
  public function unlink($uri) {
    $target = $this->getLocalPath($uri);
    if ($target) {
      try {
        $response = $this->gcs->objects->delete($this->bucket, $this->folder . '/' . $target);
        if ($response == NULL) {
          return TRUE;
        }
      }
      catch (Exceception $e) {
        watchdog_exception('google_cdn', $e, 'GoogleCDNStreamWrapper::unlink');
      }
    }
    return FALSE;
  }

  /**
   * Support for rename().
   *
   * If $to_uri exists, this file will be overwritten. This behavior is
   * identical to the PHP rename() function.
   *
   * @param string $from_uri
   *   The uri to the file to rename.
   * @param string $to_uri
   *   The new uri for file.
   *
   * @return bool
   *   TRUE if file was successfully renamed.
   *
   * @see http://php.net/manual/en/streamwrapper.rename.php
   */
  public function rename($from_uri, $to_uri) {
    $this->callConstructor();
    $from = $this->getLocalPath($from_uri);
    $to = $this->getLocalPath($to_uri);

    if ($from && $to) {
      try {
        $response = $this->gcs->objects->insert($this->bucket, $this->folder . '/' . $to);
        if ($response) {
          $deleted = $this->unlink($from_uri);
          if ($deleted) {
            return TRUE;
          }
        }
      }
      catch (Exception $e) {
        watchdog_exception('google_cdn', $e, 'GoogleCDNStreamWrapper::rename');
      }
    }
    return FALSE;
  }

  /**
   * Returns the local writable target of the resource within the stream.
   *
   * This function should be used in place of calls to realpath() or similar
   * functions when attempting to determine the location of a file. While
   * functions like realpath() may return the location of a read-only file, this
   * method may return a URI or path suitable for writing that is completely
   * separate from the URI used for reading.
   *
   * @param string $uri
   *   Optional URI.
   *
   * @return string
   *   Returns a string representing a location suitable for writing of a file,
   *   or FALSE if unable to write to the file such as with read-only streams.
   */
  protected function getTarget($uri = NULL) {
    if (!isset($uri)) {
      $uri = $this->uri;
    }

    list($scheme, $target) = explode('://', $uri, 2);

    // Remove erroneous leading or trailing forward-slashes and backslashes.
    return trim($target, '\/');
  }

  /**
   * Support for mkdir().
   *
   * Google Cloud Storage is not a tree structure, so folder's
   * do not exist.
   *
   * @param string $uri
   *   A string containing the URI to the directory to create.
   * @param int $mode
   *   Permission flags - see mkdir().
   * @param int $options
   *   A bit mask of STREAM_REPORT_ERRORS and STREAM_MKDIR_RECURSIVE.
   *
   * @return bool
   *   TRUE if directory was successfully created.
   *
   * @see http://php.net/manual/en/streamwrapper.mkdir.php
   */
  public function mkdir($uri, $mode, $options) {
    return TRUE;
  }

  /**
   * Support for rmdir().
   *
   * @param string $uri
   *   A string containing the URI to the directory to delete.
   * @param int $options
   *   A bit mask of STREAM_REPORT_ERRORS.
   *
   * @return bool
   *   TRUE if directory was successfully removed.
   * @see http://php.net/manual/en/streamwrapper.rmdir.php
   */
  public function rmdir($uri, $options) {
    return TRUE;
  }


  /**
   * Support for stat().
   *
   * @param string $uri
   *   A string containing the URI to get information about.
   * @param int $flags
   *   A bit mask of STREAM_URL_STAT_LINK and STREAM_URL_STAT_QUIET.
   *
   * @return array
   *   An array with file status, or FALSE in case of an error - see fstat()
   *   for a description of this array.
   *
   * @see http://php.net/manual/en/streamwrapper.url-stat.php
   */
  public function url_stat($uri, $flags) {
    $this->callConstructor();
    return $this->_stat($uri);
  }

  /**
   * Gets the name of the directory from a given path.
   *
   * This method is usually accessed through drupal_dirname(), which wraps
   * around the normal PHP dirname() function, which does not support stream
   * wrappers.
   *
   * @param string $uri
   *   An optional URI.
   *
   * @return string
   *   A string containing the directory name, or FALSE if not applicable.
   *
   * @see drupal_dirname()
   */
  public function dirname($uri = NULL) {
    list($scheme, $target) = explode('://', $uri, 2);
    $target  = $this->getTarget($uri);
    $dirname = dirname($target);

    if ($dirname === '.') {
      $dirname = '';
    }

    return $scheme . '://' . $dirname;
  }

  /**
   * Support for opendir().
   *
   * There are no directories in Google Cloud Storage.
   *
   * @param string $uri
   *   A string containing the URI to the directory to open.
   * @param array $options
   *   Unknown (parameter is not documented in PHP Manual).
   *
   * @return bool
   *   TRUE on success.
   *
   * @see http://php.net/manual/en/streamwrapper.dir-opendir.php
   */
  public function dir_opendir($uri, $options) {
    return TRUE;
  }

  /**
   * Support for readdir().
   *
   * There are no directories in Google Cloud Storage.
   *
   * @return string|bool
   *   The next filename, or FALSE if there are no more files in the directory.
   *
   * @see http://php.net/manual/en/streamwrapper.dir-readdir.php
   */
  public function dir_readdir() {
    return FALSE;
  }

  /**
   * Support for rewinddir().
   *
   * There are no directories in Google Cloud Storage.
   *
   * @return bool
   *   TRUE on success.
   *
   * @see http://php.net/manual/en/streamwrapper.dir-rewinddir.php
   */
  public function dir_rewinddir() {
    return TRUE;
  }

  /**
   * Support for closedir().
   *
   * There are no directories in Google Cloud Storage.
   *
   * @return bool
   *   TRUE on success.
   *
   * @see http://php.net/manual/en/streamwrapper.dir-closedir.php
   */
  public function dir_closedir() {
    return TRUE;
  }

  /**
   * Return the local filesystem path.
   *
   * @param string $uri
   *   Optional URI, supplied when doing a move or rename.
   */
  protected function getLocalPath($uri = NULL) {
    if (!isset($uri)) {
      $uri = $this->uri;
    }

    $path  = str_replace('gs://', '', $uri);
    $path = trim($path, '/');
    return $path;
  }

  /**
   * Flush the object buffers.
   */
  protected function clearBuffer() {
    $this->position = 0;
    $this->objectSize = 0;
    $this->buffer = NULL;
    $this->bufferWrite = FALSE;
    $this->bufferLength = 0;
    $this->object = NULL;
  }

  /**
   * Get the Google Cloud Storage connection.
   *
   * @return Google Client
   *
   */
  protected function getGCS() {
    if ($this->gcs == NULL) {
      if (!libraries_load('google-api-php-client')) {
        drupal_set_message(t('Unable to load the Google API PHP library. Please check you have installed the library correctly.') . 'error');
      }
      elseif (empty($this->bucket)) {
        drupal_set_message(t('Bucket name not configured.') . 'error');
      }
      else {
        try {
          $client = new Google_Client();
          // Replace this with your application name.
          $client->setApplicationName($this->service_account_name);
          // Replace this with the service you are using.
          $service = new Google_StorageService($client);
          // This file location should point to the private key file.
          $key = file_get_contents($this->key_file_path);
          $cred = new Google_AssertionCredentials(
          // Replace this with the email address from the client.
            $this->service_account_name,
            // Replace this with the scopes you are requesting.
            array('https://www.googleapis.com/auth/devstorage.full_control'),
            $key
          );

          $client->setAssertionCredentials($cred);
          if($client->getAuth()->isAccessTokenExpired()) {
            $client->getAuth()->refreshTokenWithAssertion($cred);
          }

          // Store services for later use.
          $this->gcs = $service;
          $this->client = $client;
        }
        catch (Exception $e) {
          watchdog_exception('google_cdn', $e, 'GoogleCDNStreamWrapper::getGCS');
        }
      }
    }
  }

  /**
   * Creates a signed url for the content.
   *
   * @param $expiry
   * @param $filename
   * @return null|string
   */
  protected function generate_signed_url($filename) {
    $expiry = time() + GOOGLE_CDN_SIGNED_URL_EXPIRY;

    // This policy is defined in https://developers.google.com/storage/docs/accesscontrol#Signed-URLs
    $stringPolicy = "GET\n\n\n" . $expiry . "\n/" . $this->bucket . '/' . $this->folder . '/' . $filename;

    //this is a PEM version of the pks12 key generated by google.
    $fp = fopen($this->pem_file, 'r');
    $private_key = fread($fp, 8192);
    fclose($fp);
    $pkeyid = openssl_get_privatekey($private_key, "notasecret");

    if (openssl_sign($stringPolicy, $signature, $pkeyid, 'sha256')) {
      $signature = urlencode(base64_encode($signature));
    }

    $url = NULL;
    if ($signature) {
      $secure = 'http://';
      if ($this->https) {
        $secure = 'https://';
      }
      $url = $secure . $this->bucket . '.' . $this->domain . '/' . $this->folder . '/' . $filename . '?GoogleAccessId=' . $this->service_account_name . '&Expires=' . $expiry . '&Signature=' . $signature;
    }

    return $url;
  }

  /**
   * Get file status.
   *
   * @return array
   *   An array with file status, or FALSE in case of an error - see fstat()
   *   for a description of this array.
   *
   * @see http://php.net/manual/en/streamwrapper.stream-stat.php
   */
  protected function _stat($uri = NULL) {
    if (!isset($uri)) {
      $uri = $this->uri;
    }
    $this->uri = $uri;
    $target = $this->getTarget($uri);
    if ($target) {
      try {
        $response = $this->gcs->objects->get($this->bucket, $this->folder . '/' . $target);
        if ($response) {
          $mode = 0100000;
          $mode |= 0777;

          $stat = array();
          $stat[0] = $stat['dev'] = 0;
          $stat[1] = $stat['ino'] = 0;
          $stat[2] = $stat['mode'] = $mode;
          $stat[3] = $stat['nlink'] = 0;
          $stat[4] = $stat['uid'] = 0;
          $stat[5] = $stat['gid'] = 0;
          $stat[6] = $stat['rdev'] = 0;
          $stat[7] = $stat['size'] = 0;
          $stat[8] = $stat['atime'] = 0;
          $stat[9] = $stat['mtime'] = 0;
          $stat[10] = $stat['ctime'] = 0;
          $stat[11] = $stat['blksize'] = 0;
          $stat[12] = $stat['blocks'] = 0;
          $stat[4] = $stat['uid'] = 0;
          $stat[7] = $stat['size'] = $response['size'];
          $stat[8] = $stat['atime'] = $response['generation'];
          $stat[9] = $stat['mtime'] = $response['generation'];
          $stat[10] = $stat['ctime'] = $response['generation'];
          return $stat;
        }
      }
      catch (Exception $e) {
        watchdog_exception('google_cdn', $e, 'GoogleCDNStreamWrapper::_stat');
      }
    }

    return FALSE;
  }

  /**
   * Assert that the constructor has been called, call it if not.
   *
   * Due to PHP bug #40459, the constructor of this class isn't always called
   * for some of the methods. This private method calls the constructor if
   * it hasn't been called before.
   *
   * @see https://bugs.php.net/bug.php?id=40459
   */
  protected function callConstructor() {
    if ($this->gcs == NULL) {
      $this->__construct();
    }
  }
}