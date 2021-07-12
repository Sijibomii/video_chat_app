import React, { ReactElement, useState } from 'react';
import ReactTooltip from 'react-tooltip';
import classnames from 'classnames';
import Spinner from 'react-spinner';
import clipboardCopy from 'clipboard-copy';//not sure its installed
import hark from 'hark';
import * as faceapi from 'face-api.js';
import EditableInput from './EditableInput';
import { If, Choose, When, Otherwise } from "react-if";
const tinyFaceDetectorOptions = new faceapi.TinyFaceDetectorOptions({
		inputSize      : 160,
		scoreThreshold : 0.5
	});
  interface inputProps {
      isMe: any
			peer: any
			audioProducerId: any
			videoProducerId: any
			audioConsumerId: any
			videoConsumerId: any
			videoRtpParameters: any
			consumerSpatialLayers: any
			consumerTemporalLayers: any
			consumerCurrentSpatialLayer: any
			consumerCurrentTemporalLayer: any
			consumerPreferredSpatialLayer: any
			consumerPreferredTemporalLayer: any
			consumerPriority: any
			audioMuted: any
			videoVisible: any
			videoMultiLayer: any
			audioCodec: any
			videoCodec: any
			audioScore: any
			videoScore: any
			onChangeDisplayName: any
			onChangeMaxSendingSpatialLayer: any
			onChangeVideoPreferredLayers: any
			onChangeVideoPriority: any 
			onRequestKeyFrame: any
			onStatsClick: any
      audioTrack: any
      audioRtpParameters:any
      videoTrack:any
      faceDetection: boolean
  }
const PeerView: React.FC<inputProps>= ({
  faceDetection,
      isMe,
			peer,
			audioProducerId,
			videoProducerId,
			audioConsumerId,
			videoConsumerId,
			videoRtpParameters,
      audioRtpParameters,
			consumerSpatialLayers,
			consumerTemporalLayers,
			consumerCurrentSpatialLayer,
			consumerCurrentTemporalLayer,
			consumerPreferredSpatialLayer,
			consumerPreferredTemporalLayer,
			consumerPriority,
			audioMuted,
			videoVisible,
			videoMultiLayer,
			audioCodec,
			videoCodec,
			audioScore,
			videoScore,
			onChangeDisplayName,
			onChangeMaxSendingSpatialLayer,
			onChangeVideoPreferredLayers,
			onChangeVideoPriority, 
			onRequestKeyFrame,
			onStatsClick,
      audioTrack,
      videoTrack
  }):ReactElement<any, any> | null =>{
  const [state, setState]= useState({
    audioVolume  : 0, // Integer from 0 to 10.,
			showInfo : window.SHOW_INFO || false,
			videoResolutionWidth  : null,
			videoResolutionHeight : null,
			videoCanPlay          : false,
			videoElemPaused       : false,
			maxSpatialLayer       : 0
  });
  
  const [_audioTrack, setAudioTrack]= useState(null);
  const [_videoTrack, setVideoTrack]=useState(null);// Latest received video track.
  const [hark, setHark]= useState(null) //Hark instance
  const [videoResolutionPeriodicTimer, setvideoResolutionPeriodicTimer]=useState(null);// Periodic timer for reading video resolution.
  const [faceDetectionRequestAnimationFrame, setfaceDetectionRequestAnimationFrame]= useState(null);// requestAnimationFrame for face detection.
  
  const _setTracks=(audioTrack: any, videoTrack: any)=>{
	

		if (_audioTrack === audioTrack && _videoTrack === videoTrack)
			return;

		setAudioTrack(audioTrack);
	  setVideoTrack(videoTrack);

		if (hark && hark!== null) hark.stop();

	//	_stopVideoResolution();

		if (faceDetection)
			//_stopFaceDetection();

		const { audioElem, videoElem } = .refs;

		if (audioTrack)
		{
			const stream = new MediaStream;

			stream.addTrack(audioTrack);
			audioElem.srcObject = stream;

			audioElem.play()
				.catch((error) => console.log('audioElem.play() failed:%o', error));

			_runHark(stream);
		}
		else
		{
			audioElem.srcObject = null;
		}

		if (videoTrack)
		{
			const stream = new MediaStream;

			stream.addTrack(videoTrack);
			videoElem.srcObject = stream;

			videoElem.oncanplay = () => this.setState({ videoCanPlay: true });

			videoElem.onplay = () =>
			{
				this.setState({ videoElemPaused: false });

				audioElem.play()
					.catch((error) => logger.warn('audioElem.play() failed:%o', error));
			};

			videoElem.onpause = () => this.setState({ videoElemPaused: true });

			videoElem.play()
				.catch((error) => logger.warn('videoElem.play() failed:%o', error));

			this._startVideoResolution();

			if (faceDetection)
				this._startFaceDetection();
		}
		else
		{
			videoElem.srcObject = null;
		}
	}

// 	_runHark(stream)
// 	{
// 		if (!stream.getAudioTracks()[0])
// 			throw new Error('_runHark() | given stream has no audio track');

// 		this._hark = hark(stream, { play: false });

// 		// eslint-disable-next-line no-unused-vars
// 		this._hark.on('volume_change', (dBs, threshold) =>
// 		{
// 			// The exact formula to convert from dBs (-100..0) to linear (0..1) is:
// 			//   Math.pow(10, dBs / 20)
// 			// However it does not produce a visually useful output, so let exagerate
// 			// it a bit. Also, let convert it from 0..1 to 0..10 and avoid value 1 to
// 			// minimize component renderings.
// 			let audioVolume = Math.round(Math.pow(10, dBs / 85) * 10);

// 			if (audioVolume === 1)
// 				audioVolume = 0;

// 			if (audioVolume !== this.state.audioVolume)
// 				this.setState({ audioVolume });
// 		});
// 	}

// 	_startVideoResolution()
// 	{
// 		this._videoResolutionPeriodicTimer = setInterval(() =>
// 		{
// 			const { videoResolutionWidth, videoResolutionHeight } = this.state;
// 			const { videoElem } = this.refs;

// 			if (
// 				videoElem.videoWidth !== videoResolutionWidth ||
// 				videoElem.videoHeight !== videoResolutionHeight
// 			)
// 			{
// 				this.setState(
// 					{
// 						videoResolutionWidth  : videoElem.videoWidth,
// 						videoResolutionHeight : videoElem.videoHeight
// 					});
// 			}
// 		}, 500);
// 	}

// 	_stopVideoResolution()
// 	{
// 		clearInterval(this._videoResolutionPeriodicTimer);

// 		this.setState(
// 			{
// 				videoResolutionWidth  : null,
// 				videoResolutionHeight : null
// 			});
// 	}

// 	_startFaceDetection()
// 	{
// 		const { videoElem, canvas } = this.refs;

// 		const step = async () =>
// 		{
// 			// NOTE: Somehow this is critical. Otherwise the Promise returned by
// 			// faceapi.detectSingleFace() never resolves or rejects.
// 			if (!this._videoTrack || videoElem.readyState < 2)
// 			{
// 				this._faceDetectionRequestAnimationFrame = requestAnimationFrame(step);

// 				return;
// 			}

// 			const detection =
// 				await faceapi.detectSingleFace(videoElem, tinyFaceDetectorOptions);

// 			if (detection)
// 			{
// 				const width = videoElem.offsetWidth;
// 				const height = videoElem.offsetHeight;

// 				canvas.width = width;
// 				canvas.height = height;

// 				// const resizedDetection = detection.forSize(width, height);
// 				const resizedDetections =
// 					faceapi.resizeResults(detection, { width, height });

// 				faceapi.draw.drawDetections(canvas, resizedDetections);
// 			}
// 			else
// 			{
// 				// Trick to hide the canvas rectangle.
// 				canvas.width = 0;
// 				canvas.height = 0;
// 			}

// 			this._faceDetectionRequestAnimationFrame =
// 				requestAnimationFrame(() => setTimeout(step, 100));
// 		};

// 		step();
// 	}

// 	_stopFaceDetection()
// 	{
// 		cancelAnimationFrame(this._faceDetectionRequestAnimationFrame);

// 		const { canvas } = this.refs;

// 		canvas.width = 0;
// 		canvas.height = 0;
// 	}

// 	_printProducerScore(id, score)
// 	{
// 		const scores = Array.isArray(score) ? score : [ score ];

// 		return (
// 			<React.Fragment key={id}>
// 				<p>streams:</p>

// 				{
// 					scores
// 						.sort((a, b) =>
// 						{
// 							if (a.rid)
// 								return (a.rid > b.rid ? 1 : -1);
// 							else
// 								return (a.ssrc > b.ssrc ? 1 : -1);
// 						})
// 						.map(({ ssrc, rid, score }, idx) => ( // eslint-disable-line no-shadow
// 							<p key={idx} className='indent'>
// 								<Choose>
// 									<When condition={rid !== undefined}>
// 										{`rid:${rid}, ssrc:${ssrc}, score:${score}`}
// 									</When>

// 									<Otherwise>
// 										{`ssrc:${ssrc}, score:${score}`}
// 									</Otherwise>
// 								</Choose>
// 							</p>
// 						))
// 				}
// 			</React.Fragment>
// 		);
// 	}

// 	_printConsumerScore(id, score)
// 	{
// 		return (
// 			<p key={id}>
// 				{`score:${score.score}, producerScore:${score.producerScore}, producerScores:[${score.producerScores}]`}
// 			</p>
// 		);
// 	}
// }

  return (
    <div data-component='PeerView'>
      <div className='info'>
        <div className='icons'>
          <div
            className={classnames('icon', 'info', { on: state.showInfo })}
            onClick={() => setState({ ...state,  showInfo: !state.showInfo })}
          />

          <div
            className={classnames('icon', 'stats')}
            onClick={() => onStatsClick(peer.id)}
          />
        </div>

        <div className={classnames('box', { visible: state.showInfo })}>
          <If condition={audioProducerId || audioConsumerId}>
            <h1>audio</h1>

            <If condition={audioProducerId}>
              <p>
                {'id: '}
                <span
                  className='copiable'
                  data-tip='Copy audio producer id to clipboard'
                  onClick={() => clipboardCopy(`"${audioProducerId}"`)}
                >
                  {audioProducerId}
                </span>
              </p>

              <ReactTooltip
                type='light'
                effect='solid'
                delayShow={1500}
                delayHide={50}
              />
            </If>

            <If condition={audioConsumerId}>
              <p>
                {'id: '}
                <span
                  className='copiable'
                  data-tip='Copy video producer id to clipboard'
                  onClick={() => clipboardCopy(`"${audioConsumerId}"`)}
                >
                  {audioConsumerId}
                </span>
              </p>

              <ReactTooltip
                type='light'
                effect='solid'
                delayShow={1500}
                delayHide={50}
              />
            </If>

            <If condition={audioCodec}>
              <p>codec: {audioCodec}</p>
            </If>

            <If condition={audioProducerId && audioScore}>
              {this._printProducerScore(audioProducerId, audioScore)}
            </If>

            <If condition={audioConsumerId && audioScore}>
              {this._printConsumerScore(audioConsumerId, audioScore)}
            </If>
          </If>

          <If condition={videoProducerId || videoConsumerId}>
            <h1>video</h1>

            <If condition={videoProducerId}>
              <p>
                {'id: '}
                <span
                  className='copiable'
                  data-tip='Copy audio consumer id to clipboard'
                  onClick={() => clipboardCopy(`"${videoProducerId}"`)}
                >
                  {videoProducerId}
                </span>
              </p>

              <ReactTooltip
                type='light'
                effect='solid'
                delayShow={1500}
                delayHide={50}
              />
            </If>

            <If condition={videoConsumerId}>
              <p>
                {'id: '}
                <span
                  className='copiable'
                  data-tip='Copy video consumer id to clipboard'
                  onClick={() => clipboardCopy(`"${videoConsumerId}"`)}
                >
                  {videoConsumerId}
                </span>
              </p>

              <ReactTooltip
                type='light'
                effect='solid'
                delayShow={1500}
                delayHide={50}
              />
            </If>

            <If condition={videoCodec}>
              <p>codec: {videoCodec}</p>
            </If>

            <If condition={videoVisible && state.videoResolutionWidth !== null}>
              <p>resolution: {state.videoResolutionWidth}x{state.videoResolutionHeight}</p>
            </If>

            <If
              condition={
                videoVisible &&
                videoProducerId &&
                videoRtpParameters.encodings.length > 1
              }
            >
              <p>
                max spatial layer: {
                 state.maxSpatialLayer !==null ? state.maxSpatialLayer > -1 ? state.maxSpatialLayer : 'none' : null 
                }
                <span>{' '}</span>
                <span
                  className={classnames({
                    clickable : state.maxSpatialLayer > -1
                  })}
                  onClick={(event) =>
                  {
                    event.stopPropagation();

                    const newMaxSpatialLayer = state.maxSpatialLayer -1;

                    onChangeMaxSendingSpatialLayer(newMaxSpatialLayer);
                    this.setState({ maxSpatialLayer: newMaxSpatialLayer });
                  }}
                >
                  {'[ down ]'}
                </span>
                <span>{' '}</span>
                <span
                  className={classnames({
                    clickable : state.maxSpatialLayer < videoRtpParameters.encodings.length - 1
                  })}
                  onClick={(event) =>
                  {
                    event.stopPropagation();

                    const newMaxSpatialLayer = state.maxSpatialLayer + 1;

                    onChangeMaxSendingSpatialLayer(newMaxSpatialLayer);
                    this.setState({ maxSpatialLayer: newMaxSpatialLayer });
                  }}
                >
                  {'[ up ]'}
                </span>
              </p>
            </If>

            <If condition={!isMe && videoMultiLayer}>
              <p>
                {`current spatial-temporal layers: ${consumerCurrentSpatialLayer} ${consumerCurrentTemporalLayer}`}
              </p>
              <p>
                {`preferred spatial-temporal layers: ${consumerPreferredSpatialLayer} ${consumerPreferredTemporalLayer}`}
                <span>{' '}</span>
                <span
                  className='clickable'
                  onClick={(event) =>
                  {
                    event.stopPropagation();

                    let newPreferredSpatialLayer = consumerPreferredSpatialLayer;
                    let newPreferredTemporalLayer;

                    if (consumerPreferredTemporalLayer > 0)
                    {
                      newPreferredTemporalLayer = consumerPreferredTemporalLayer - 1;
                    }
                    else
                    {
                      if (consumerPreferredSpatialLayer > 0)
                        newPreferredSpatialLayer = consumerPreferredSpatialLayer - 1;
                      else
                        newPreferredSpatialLayer = consumerSpatialLayers - 1;

                      newPreferredTemporalLayer = consumerTemporalLayers - 1;
                    }

                    onChangeVideoPreferredLayers(
                      newPreferredSpatialLayer, newPreferredTemporalLayer);
                  }}
                >
                  {'[ down ]'}
                </span>
                <span>{' '}</span>
                <span
                  className='clickable'
                  onClick={(event) =>
                  {
                    event.stopPropagation();

                    let newPreferredSpatialLayer = consumerPreferredSpatialLayer;
                    let newPreferredTemporalLayer;

                    if (consumerPreferredTemporalLayer < consumerTemporalLayers - 1)
                    {
                      newPreferredTemporalLayer = consumerPreferredTemporalLayer + 1;
                    }
                    else
                    {
                      if (consumerPreferredSpatialLayer < consumerSpatialLayers - 1)
                        newPreferredSpatialLayer = consumerPreferredSpatialLayer + 1;
                      else
                        newPreferredSpatialLayer = 0;

                      newPreferredTemporalLayer = 0;
                    }

                    onChangeVideoPreferredLayers(
                      newPreferredSpatialLayer, newPreferredTemporalLayer);
                  }}
                >
                  {'[ up ]'}
                </span>
              </p>
            </If>

            <If condition={!isMe && videoCodec && consumerPriority > 0}>
              <p>
                {`priority: ${consumerPriority}`}
                <span>{' '}</span>
                <span
                  className={classnames({
                    clickable : consumerPriority > 1
                  })}
                  onClick={(event) =>
                  {
                    event.stopPropagation();

                    onChangeVideoPriority(consumerPriority - 1);
                  }}
                >
                  {'[ down ]'}
                </span>
                <span>{' '}</span>
                <span
                  className={classnames({
                    clickable : consumerPriority < 255
                  })}
                  onClick={(event) =>
                  {
                    event.stopPropagation();

                    onChangeVideoPriority(consumerPriority + 1);
                  }}
                >
                  {'[ up ]'}
                </span>
              </p>
            </If>

            <If condition={!isMe && videoCodec}>
              <p>
                <span
                  className='clickable'
                  onClick={(event) =>
                  {
                    event.stopPropagation();

                    if (!onRequestKeyFrame)
                      return;

                    onRequestKeyFrame();
                  }}
                >
                  {'[ request keyframe ]'}
                </span>
              </p>
            </If>

            <If condition={videoProducerId && videoScore}>
              {this._printProducerScore(videoProducerId, videoScore)}
            </If>

            <If condition={videoConsumerId && videoScore}>
              {this._printConsumerScore(videoConsumerId, videoScore)}
            </If>
          </If>
        </div>

        <div className={classnames('peer', { 'is-me': isMe })}>
          <Choose>
            <When condition={isMe}>
              <EditableInput
                value={peer.displayName}
                propName='displayName'
                className='display-name editable'
                classLoading='loading'
                classInvalid='invalid'
                shouldBlockWhileLoading
                editProps={{
                  maxLength   : 20,
                  autoCorrect : 'false',
                  spellCheck  : 'false'
                }}
                onChange={({ displayName }) => onChangeDisplayName(displayName)}
              />
            </When>

            <Otherwise>
              <span className='display-name'>
                {peer.displayName}
              </span>
            </Otherwise>
          </Choose>

          <div className='row'>
            <span
              className={classnames('device-icon', peer.device.flag)}
            />
            <span className='device-version'>
              {peer.device.name} {peer.device.version || null}
            </span>
          </div>
        </div>
      </div>

      <video
        ref='videoElem'
        className={classnames({
          'is-me'         : isMe,
          hidden          : !videoVisible || !videoCanPlay,
          'network-error' : (
            videoVisible && videoMultiLayer && consumerCurrentSpatialLayer === null
          )
        })}
        autoPlay
        playsInline
        muted
        controls={false}
      />

      <audio
        ref='audioElem'
        autoPlay
        playsInline
        muted={isMe || audioMuted}
        controls={false}
      />

      <canvas
        ref='canvas'
        className={classnames('face-detection', { 'is-me': isMe })}
      />

      <div className='volume-container'>
        <div className={classnames('bar', `level${audioVolume}`)} />
      </div>

      <If condition={videoVisible && videoScore < 5}>
        <div className='spinner-container'>
          <Spinner />
        </div>
      </If>

      <If condition={videoElemPaused}>
        <div className='video-elem-paused' />
      </If>
    </div>
  );
}
export default PeerView;
// componentDidMount()
// 	{
// 		const { audioTrack, videoTrack } = this.props;

// 		this._setTracks(audioTrack, videoTrack);
// 	}

// 	componentWillUnmount()
// 	{
// 		if (this._hark)
// 			this._hark.stop();

// 		clearInterval(this._videoResolutionPeriodicTimer);
// 		cancelAnimationFrame(this._faceDetectionRequestAnimationFrame);

// 		const { videoElem } = this.refs;

// 		if (videoElem)
// 		{
// 			videoElem.oncanplay = null;
// 			videoElem.onplay = null;
// 			videoElem.onpause = null;
// 		}
// 	}

// 	componentWillUpdate()
// 	{
// 		const {
// 			isMe,
// 			audioTrack,
// 			videoTrack,
// 			videoRtpParameters
// 		} = this.props;

// 		const { maxSpatialLayer } = this.state;

// 		if (isMe && videoRtpParameters && maxSpatialLayer === null)
// 		{
// 			this.setState(
// 				{
// 					maxSpatialLayer : videoRtpParameters.encodings.length - 1
// 				});
// 		}
// 		else if (isMe && !videoRtpParameters && maxSpatialLayer !== null)
// 		{
// 			this.setState({ maxSpatialLayer: null });
// 		}

// 		this._setTracks(audioTrack, videoTrack);
// 	}